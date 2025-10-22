import { BaseCharacter } from '/process/BaseCharacter.js';
import { createModelMatrix, createMesh, drawObject } from '../CreateObject.js';
import { MeshUtilsCurves } from '../MeshUtilsCurves.js';
import { MeshUtils } from '../MeshUtils.js';
import * as Curves from '../curves.js';
import { makeModel, setLocalRotationAxisAngle, applyBoneOffsetMesh } from "../bone.js";
import { GL, attribs } from '../main.js'

export class mr_mime extends BaseCharacter {
    constructor() {
        super();

        // --- 1. Definisi Kurva (untuk Rambut & Sepatu) ---
        // Kurva untuk "rambut" biru (seperti tanduk)
        const hairCurveL = Curves.cubicBezier3D(
            [0, 0, 0],    // p0 (pangkal di kepala)
            [0.5, 1.5, 0],  // p1 (kontrol, melengkung ke atas)
            [0.2, 2.5, 0.3],  // p2 (kontrol, melengkung ke atas-luar)
            [0, 3, 0]     // p3 (ujung)
        );
        
        // Kurva untuk "rambut" biru kanan (cerminan)
        const hairCurveR = Curves.cubicBezier3D(
            [0, 0, 0],    // p0
            [-0.5, 1.5, 0], // p1
            [-0.2, 2.5, 0.3], // p2
            [0, 3, 0]     // p3
        );

        // Kurva untuk ujung sepatu yang melengkung
        const shoeTipCurve = Curves.cubicBezier3D(
            [0, 0, 0],    // p0 (di depan sepatu)
            [0, 0.5, 0.3],  // p1 (kontrol, mulai naik)
            [0, 0.8, 0.2],  // p2 (kontrol, melengkung)
            [0, 1.0, 0]     // p3 (ujung lengkungan)
        );


        // --- 2. `this.meshes` (Inventaris Suku Cadang) ---
        // Semua mesh dibuat di [0,0,0]
        this.meshes = {
            // Badan & Kepala (Ellipsoid)
            bodyMesh: createMesh(MeshUtils.generateEllipsoid, { params: [1.8, 2, 1.8, 32, 32], deferBuffer: false }),
            headMesh: createMesh(MeshUtils.generateEllipsoid, { params: [1.2, 1.2, 1.2, 32, 32], deferBuffer: false }),
            
            // Sendi (Ellipsoid)
            jointMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.3, 0.3, 0.3, 16, 10], deferBuffer: false }),
            
            // =================================================================
            // ========== PERUBAHAN: Lengan/Kaki -> Hyperboloid ==========
            // =================================================================
            // Anggota Badan (Lengan & Kaki) -> Hyperboloid of 1 Sheet
            // params: [a, b, c, uSteps, vSteps, vMax]
            limbMesh: createMesh(MeshUtils.generateHyperboloidSheets, { params: [0.1, 0.1, 0.4, 16, 1, 1.6], deferBuffer: false }),
            
            // Tangan (Ellipsoid) & Jari (Elliptical Cylinder)
            handMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.6, 0.2, 0.8, 16, 16], deferBuffer: false }), // Telapak tangan gepeng
            fingerMesh: createMesh(MeshUtils.generateEllipticalCylinder, { params: [0.1, 0.1, 0.1, 0.1, 0.5], deferBuffer: false }), // Jari
            fingerTipMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.12, 0.12, 0.12, 8, 8], deferBuffer: false }), // Ujung jari merah
            
            // =================================================================
            // ========== PERUBAHAN: Sepatu -> Elliptic Paraboloid ==========
            // =================================================================
            // Sepatu -> Elliptic Paraboloid
            // params: [a, b, c, height, slices, stacks]
            shoeMesh: createMesh(MeshUtils.generateEllipticParaboloid, { params: [0.5, 0.8, 1, 0.4, 16, 16], deferBuffer: false }), // Bagian utama sepatu
            
            // Ujung Sepatu (Curve + Tube/Cylinder) -> Sudah benar
            shoeTipMesh: createMesh(MeshUtilsCurves.generateVariableTube, { 
                params: [shoeTipCurve, 0, 1, 20, [0.2, 0.15, 0.1], 8], // Ujung melengkung
                deferBuffer: false 
            }),
            
            // Aksesori (Ellipsoid)
            hairMeshL: createMesh(MeshUtilsCurves.generateVariableTube, { 
                params: [hairCurveL, 0, 1, 30, [0.8, 0.5, 0.2], 16], 
                deferBuffer: false 
            }),
            hairMeshR: createMesh(MeshUtilsCurves.generateVariableTube, { 
                params: [hairCurveR, 0, 1, 30, [0.8, 0.5, 0.2], 16], 
                deferBuffer: false 
            }),
            redDotMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.4, 0.4, 0.1, 16, 16], deferBuffer: false }), // Titik merah perut (gepeng)
            cheekDotMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.3, 0.3, 0.1, 16, 16], deferBuffer: false }),
            eyeMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.2, 0.3, 0.05, 16, 16], deferBuffer: false }), // Mata (hitam)
        };

        // --- 3. `this.skeleton` (Hierarki Tulang) ---
        // (x, y, z) -> y = atas, z = depan
        // (Tidak ada perubahan di sini)
        this.skeleton = {
            // Root & Badan
            hip: this.createBone("hip", null, { translate: [0, 0, 0] }), // ROOT
            torso: this.createBone("torso", "hip", { translate: [0, 1.5, 0] }),
            head: this.createBone("head", "torso", { translate: [0, 2.5, 0] }),

            // Aksesori Kepala
            hairL: this.createBone("hairL", "head", { translate: [0.8, 0.8, 0] }),
            hairR: this.createBone("hairR", "head", { translate: [-0.8, 0.8, 0] }),
            cheekL: this.createBone("cheekL", "head", { translate: [0.9, -0.2, 0.8] }),
            cheekR: this.createBone("cheekR", "head", { translate: [-0.9, -0.2, 0.8] }),
            eyeL: this.createBone("eyeL", "head", { translate: [0.5, 0.2, 1.1] }),
            eyeR: this.createBone("eyeR", "head", { translate: [-0.5, 0.2, 1.1] }),

            // Lengan Kiri
            shoulderL: this.createBone("shoulderL", "torso", { translate: [1.3, 1.0, 0] }),
            upperArmL: this.createBone("upperArmL", "shoulderL", { translate: [0, -2.8, 0] }),
            elbowL: this.createBone("elbowL", "upperArmL", { translate: [0, -1.8, 0] }), // Disesuaikan sedikit untuk hyperboloid
            lowerArmL: this.createBone("lowerArmL", "elbowL", { translate: [0, -0.2, 0] }),
            handL: this.createBone("handL", "lowerArmL", { translate: [0, -1.8, 0] }), // Disesuaikan sedikit untuk hyperboloid
            finger1L: this.createBone("finger1L", "handL", { translate: [0.2, 0, 0.6] }), // Ibu jari
            finger2L: this.createBone("finger2L", "handL", { translate: [0.1, 0.1, 0.3] }),
            finger3L: this.createBone("finger3L", "handL", { translate: [0, 0.1, 0] }),
            finger4L: this.createBone("finger4L", "handL", { translate: [-0.1, 0.1, 0.3] }),
            finger5L: this.createBone("finger5L", "handL", { translate: [-0.2, 0.1, 0.6] }),

            // Lengan Kanan
            shoulderR: this.createBone("shoulderR", "torso", { translate: [-1.3, 1.0, 0] }),
            upperArmR: this.createBone("upperArmR", "shoulderR", { translate: [0, -2.8, 0] }),
            elbowR: this.createBone("elbowR", "upperArmR", { translate: [0, -1.8, 0] }), // Disesuaikan
            lowerArmR: this.createBone("lowerArmR", "elbowR", { translate: [0, -0.2, 0] }),
            handR: this.createBone("handR", "lowerArmR", { translate: [0, -1.8, 0] }), // Disesuaikan
            finger1R: this.createBone("finger1R", "handR", { translate: [-0.2, 0, 0.6] }), // Ibu jari
            finger2R: this.createBone("finger2R", "handR", { translate: [-0.1, 0.1, 0.3] }),
            finger3R: this.createBone("finger3R", "handR", { translate: [0, 0.1, 0] }),
            finger4R: this.createBone("finger4R", "handR", { translate: [0.1, 0.1, 0.3] }),
            finger5R: this.createBone("finger5R", "handR", { translate: [0.2, 0.1, 0.6] }),

            // Kaki Kiri
            upperLegL: this.createBone("upperLegL", "hip", { translate: [0.6, -0.2, 0] }),
            kneeL: this.createBone("kneeL", "upperLegL", { translate: [0, -1.8, 0] }), // Disesuaikan
            lowerLegL: this.createBone("lowerLegL", "kneeL", { translate: [0, -0.2, 0] }),
            footL: this.createBone("footL", "lowerLegL", { translate: [0, -1.8, 0] }), // Disesuaikan

            // Kaki Kanan
            upperLegR: this.createBone("upperLegR", "hip", { translate: [-0.6, -0.2, 0] }),
            kneeR: this.createBone("kneeR", "upperLegR", { translate: [0, -1.8, 0] }), // Disesuaikan
            lowerLegR: this.createBone("lowerLegR", "kneeR", { translate: [0, -0.2, 0] }),
            footR: this.createBone("footR", "lowerLegR", { translate: [0, -1.8, 0] }), // Disesuaikan
        };

        // --- 4. `this.updateWorld()` (Inisialisasi Matriks) ---
        this.updateWorld();

        // --- 5. `this.offsetMesh` (Konektor / Penyelaras) ---
        
        // =================================================================
        // ========== PERUBAHAN: Offset untuk Lengan/Kaki ==========
        // =================================================================
        // `generateHyperboloidSheets` dibuat di sepanjang sumbu Z.
        // Kita perlu memutarnya 90 derajat di sumbu X agar "jatuh" ke bawah (sumbu -Y).
        // Tinggi total mesh adalah `2 * c * sinh(vMax)` -> 2 * 0.4 * sinh(1.5) approx 1.7.
        // Jadi, translasinya adalah setengah dari itu, -0.85.
        const limbOffset = createModelMatrix({ 
            translate: [0, -0.85, 0], 
            rotate: [{ axis: 'x', angle: -Math.PI / 2 }] 
        });
        const fingerOffset = createModelMatrix({ translate: [0, 0.25, 0] }); // Offset untuk jari
        
        this.offsetMesh = {
            // Badan
            bodyOffset: createModelMatrix({ translate: [0, 0, 0] }),
            headOffset: createModelMatrix({ translate: [0, 0.2, 0] }),
            redDotStomach: createModelMatrix({ translate: [0, 0.5, 1.2] }), // Disesuaikan sedikit untuk body baru
            
            // Aksesori Kepala
            hairLOffset: createModelMatrix({ rotate: [{ axis: 'z', angle: -Math.PI / 8 }] }),
            hairROffset: createModelMatrix({ rotate: [{ axis: 'z', angle: Math.PI / 8 }] }),
            cheekLOffset: createModelMatrix({ rotate: [{ axis: 'y', angle: -Math.PI / 6 }] }),
            cheekROffset: createModelMatrix({ rotate: [{ axis: 'y', angle: Math.PI / 6 }] }),
            eyeLOffset: createModelMatrix({ rotate: [{ axis: 'y', angle: -Math.PI / 12 }] }),
            eyeROffset: createModelMatrix({ rotate: [{ axis: 'y', angle: Math.PI / 12 }] }),
            
            // Sendi
            shoulderLOffset: createModelMatrix({scale: [3, 3, 3]}),
            shoulderROffset: createModelMatrix({scale: [3, 3, 3]}),
            elbowLOffset: createModelMatrix({}),
            elbowROffset: createModelMatrix({}),
            kneeLOffset: createModelMatrix({}),
            kneeROffset: createModelMatrix({}),
            
            // Lengan (Menggunakan limbOffset baru)
            upperArmLOffset: limbOffset,
            lowerArmLOffset: limbOffset,
            upperArmROffset: limbOffset,
            lowerArmROffset: limbOffset,

            // Tangan
            handLOffset: createModelMatrix({ translate: [-0.6, 0, 0], rotate: [{ axis: 'x', angle: Math.PI / 2 }] }), // Putar telapak tangan dan geser agar tidak tabrak bahu
            handROffset: createModelMatrix({ translate: [0.6, 0, 0], rotate: [{ axis: 'x', angle: Math.PI / 2 }] }),
            
            // Jari (semua pakai offset sama, diposisikan oleh tulangnya)
            fingerLOffset: fingerOffset,
            fingerROffset: fingerOffset,
            fingerTipOffset: createModelMatrix({ translate: [0, 0.5, 0] }), // tempel di ujung jari

            // Kaki (Menggunakan limbOffset baru)
            upperLegLOffset: limbOffset,
            lowerLegLOffset: limbOffset,
            upperLegROffset: limbOffset,
            lowerLegROffset: limbOffset,
            
            // =================================================================
            // ========== PERUBAHAN: Offset untuk Sepatu ==========
            // =================================================================
            // `generateEllipticParaboloid` dibuat di sepanjang sumbu Z, "membuka" ke arah +Z
            // Kita putar -90 derajat di X agar menghadap ke bawah dan depan
            shoeLOffset: createModelMatrix({ 
                translate: [0, -0.1, 0.3], 
                rotate: [{ axis: 'x', angle: -Math.PI / 2 }] 
            }),
            shoeROffset: createModelMatrix({ 
                translate: [0, -0.1, 0.3], 
                rotate: [{ axis: 'x', angle: -Math.PI / 2 }] 
            }),
            
            shoeTipLOffset: createModelMatrix({ translate: [0, -0.4, 0.7] }), // Disesuaikan posisinya
            shoeTipROffset: createModelMatrix({ translate: [0, -0.4, 0.7] }), // Disesuaikan posisinya
        };
    }

    // =================================================================
    // ========== T-POSE STATIS (TIDAK BERUBAH) ==========
    // =================================================================
    animate(time) {
        // Reset semua rotasi tulang
        for (const boneName in this.skeleton) {
            this.skeleton[boneName].setLocalSpec({ rotate: [] });
        }

        // Terapkan rotasi T-Pose
        // Lengan Kiri: putar -90 derajat (RADIANS) di sumbu Z
        setLocalRotationAxisAngle(this.skeleton.shoulderL, 'z', -Math.PI / 2); 

        // Lengan Kanan: putar +90 derajat (RADIANS) di sumbu Z
        setLocalRotationAxisAngle(this.skeleton.shoulderR, 'z', Math.PI / 2);

        // WAJIB: Update semua world matrix setelah mengubah local spec
        this.updateWorld();
    }
    // =================================================================
    // =================================================================


    drawObject() {
        // (Tidak ada perubahan di sini, hanya menggambar)
        const C_PINK = [1.0, 0.71, 0.76];
        const C_BLUE = [0.2, 0.53, 0.8];
        const C_RED = [0.8, 0.1, 0.1];
        const C_WHITE = [1.0, 1.0, 1.0];
        const C_BLACK = [0.1, 0.1, 0.1];

        // --- BADAN & KEPALA ---
        let body = applyBoneOffsetMesh(this.skeleton.torso, this.meshes.bodyMesh.solid.mesh, this.offsetMesh.bodyOffset);
        drawObject(body.buffers, body.modelMatrix, C_WHITE, GL.TRIANGLES);
        
        let stomachDot = applyBoneOffsetMesh(this.skeleton.torso, this.meshes.redDotMesh.solid.mesh, this.offsetMesh.redDotStomach);
        drawObject(stomachDot.buffers, stomachDot.modelMatrix, C_RED, GL.TRIANGLES);

        let head = applyBoneOffsetMesh(this.skeleton.head, this.meshes.headMesh.solid.mesh, this.offsetMesh.headOffset);
        drawObject(head.buffers, head.modelMatrix, C_WHITE, GL.TRIANGLES);

        // --- AKSESORI KEPALA ---
        let hairL = applyBoneOffsetMesh(this.skeleton.hairL, this.meshes.hairMeshL.solid.mesh, this.offsetMesh.hairLOffset);
        drawObject(hairL.buffers, hairL.modelMatrix, C_BLUE, GL.TRIANGLES);
        let hairR = applyBoneOffsetMesh(this.skeleton.hairR, this.meshes.hairMeshR.solid.mesh, this.offsetMesh.hairROffset);
        drawObject(hairR.buffers, hairR.modelMatrix, C_BLUE, GL.TRIANGLES);
        
        let cheekL = applyBoneOffsetMesh(this.skeleton.cheekL, this.meshes.cheekDotMesh.solid.mesh, this.offsetMesh.cheekLOffset);
        drawObject(cheekL.buffers, cheekL.modelMatrix, C_PINK, GL.TRIANGLES);
        let cheekR = applyBoneOffsetMesh(this.skeleton.cheekR, this.meshes.cheekDotMesh.solid.mesh, this.offsetMesh.cheekROffset);
        drawObject(cheekR.buffers, cheekR.modelMatrix, C_PINK, GL.TRIANGLES);
        
        let eyeL = applyBoneOffsetMesh(this.skeleton.eyeL, this.meshes.eyeMesh.solid.mesh, this.offsetMesh.eyeLOffset);
        drawObject(eyeL.buffers, eyeL.modelMatrix, C_BLACK, GL.TRIANGLES);
        let eyeR = applyBoneOffsetMesh(this.skeleton.eyeR, this.meshes.eyeMesh.solid.mesh, this.offsetMesh.eyeROffset);
        drawObject(eyeR.buffers, eyeR.modelMatrix, C_BLACK, GL.TRIANGLES);

        // --- SENDI (PINK) ---
        let shoulderL = applyBoneOffsetMesh(this.skeleton.shoulderL, this.meshes.jointMesh.solid.mesh, this.offsetMesh.shoulderLOffset);
        drawObject(shoulderL.buffers, shoulderL.modelMatrix, C_PINK, GL.TRIANGLES);
        let shoulderR = applyBoneOffsetMesh(this.skeleton.shoulderR, this.meshes.jointMesh.solid.mesh, this.offsetMesh.shoulderROffset);
        drawObject(shoulderR.buffers, shoulderR.modelMatrix, C_PINK, GL.TRIANGLES);
        let elbowL = applyBoneOffsetMesh(this.skeleton.elbowL, this.meshes.jointMesh.solid.mesh, this.offsetMesh.elbowLOffset);
        drawObject(elbowL.buffers, elbowL.modelMatrix, C_PINK, GL.TRIANGLES);
        let elbowR = applyBoneOffsetMesh(this.skeleton.elbowR, this.meshes.jointMesh.solid.mesh, this.offsetMesh.elbowROffset);
        drawObject(elbowR.buffers, elbowR.modelMatrix, C_PINK, GL.TRIANGLES);
        let kneeL = applyBoneOffsetMesh(this.skeleton.kneeL, this.meshes.jointMesh.solid.mesh, this.offsetMesh.kneeLOffset);
        drawObject(kneeL.buffers, kneeL.modelMatrix, C_PINK, GL.TRIANGLES);
        let kneeR = applyBoneOffsetMesh(this.skeleton.kneeR, this.meshes.jointMesh.solid.mesh, this.offsetMesh.kneeROffset);
        drawObject(kneeR.buffers, kneeR.modelMatrix, C_PINK, GL.TRIANGLES);

        // --- LENGAN (PUTIH) ---
        let upperArmL = applyBoneOffsetMesh(this.skeleton.upperArmL, this.meshes.limbMesh.solid.mesh, this.offsetMesh.upperArmLOffset);
        drawObject(upperArmL.buffers, upperArmL.modelMatrix, C_WHITE, GL.TRIANGLES);
        let lowerArmL = applyBoneOffsetMesh(this.skeleton.lowerArmL, this.meshes.limbMesh.solid.mesh, this.offsetMesh.lowerArmLOffset);
        drawObject(lowerArmL.buffers, lowerArmL.modelMatrix, C_WHITE, GL.TRIANGLES);
        let upperArmR = applyBoneOffsetMesh(this.skeleton.upperArmR, this.meshes.limbMesh.solid.mesh, this.offsetMesh.upperArmROffset);
        drawObject(upperArmR.buffers, upperArmR.modelMatrix, C_WHITE, GL.TRIANGLES);
        let lowerArmR = applyBoneOffsetMesh(this.skeleton.lowerArmR, this.meshes.limbMesh.solid.mesh, this.offsetMesh.lowerArmROffset);
        drawObject(lowerArmR.buffers, lowerArmR.modelMatrix, C_WHITE, GL.TRIANGLES);

        // --- KAKI (PUTIH) ---
        let upperLegL = applyBoneOffsetMesh(this.skeleton.upperLegL, this.meshes.limbMesh.solid.mesh, this.offsetMesh.upperLegLOffset);
        drawObject(upperLegL.buffers, upperLegL.modelMatrix, C_WHITE, GL.TRIANGLES);
        let lowerLegL = applyBoneOffsetMesh(this.skeleton.lowerLegL, this.meshes.limbMesh.solid.mesh, this.offsetMesh.lowerLegLOffset);
        drawObject(lowerLegL.buffers, lowerLegL.modelMatrix, C_WHITE, GL.TRIANGLES);
        let upperLegR = applyBoneOffsetMesh(this.skeleton.upperLegR, this.meshes.limbMesh.solid.mesh, this.offsetMesh.upperLegROffset);
        drawObject(upperLegR.buffers, upperLegR.modelMatrix, C_WHITE, GL.TRIANGLES);
        let lowerLegR = applyBoneOffsetMesh(this.skeleton.lowerLegR, this.meshes.limbMesh.solid.mesh, this.offsetMesh.lowerLegROffset);
        drawObject(lowerLegR.buffers, lowerLegR.modelMatrix, C_WHITE, GL.TRIANGLES);

        // --- TANGAN (PUTIH) & UJUNG JARI (MERAH) ---
        let handL = applyBoneOffsetMesh(this.skeleton.handL, this.meshes.handMesh.solid.mesh, this.offsetMesh.handLOffset);
        drawObject(handL.buffers, handL.modelMatrix, C_WHITE, GL.TRIANGLES);
        let handR = applyBoneOffsetMesh(this.skeleton.handR, this.meshes.handMesh.solid.mesh, this.offsetMesh.handROffset);
        drawObject(handR.buffers, handR.modelMatrix, C_WHITE, GL.TRIANGLES);
        
        // Jari Tangan Kiri
        ['finger1L', 'finger2L', 'finger3L', 'finger4L', 'finger5L'].forEach(boneName => {
            let finger = applyBoneOffsetMesh(this.skeleton[boneName], this.meshes.fingerMesh.solid.mesh, this.offsetMesh.fingerLOffset);
            drawObject(finger.buffers, finger.modelMatrix, C_WHITE, GL.TRIANGLES);
            let tip = applyBoneOffsetMesh(this.skeleton[boneName], this.meshes.fingerTipMesh.solid.mesh, this.offsetMesh.fingerTipOffset);
            drawObject(tip.buffers, tip.modelMatrix, C_RED, GL.TRIANGLES);
        });
        
        // Jari Tangan Kanan
        ['finger1R', 'finger2R', 'finger3R', 'finger4R', 'finger5R'].forEach(boneName => {
            let finger = applyBoneOffsetMesh(this.skeleton[boneName], this.meshes.fingerMesh.solid.mesh, this.offsetMesh.fingerROffset);
            drawObject(finger.buffers, finger.modelMatrix, C_WHITE, GL.TRIANGLES);
            let tip = applyBoneOffsetMesh(this.skeleton[boneName], this.meshes.fingerTipMesh.solid.mesh, this.offsetMesh.fingerTipOffset);
            drawObject(tip.buffers, tip.modelMatrix, C_RED, GL.TRIANGLES);
        });

        // --- SEPATU (BIRU) ---
        let shoeL = applyBoneOffsetMesh(this.skeleton.footL, this.meshes.shoeMesh.solid.mesh, this.offsetMesh.shoeLOffset);
        drawObject(shoeL.buffers, shoeL.modelMatrix, C_BLUE, GL.TRIANGLES);
        let shoeR = applyBoneOffsetMesh(this.skeleton.footR, this.meshes.shoeMesh.solid.mesh, this.offsetMesh.shoeROffset);
        drawObject(shoeR.buffers, shoeR.modelMatrix, C_BLUE, GL.TRIANGLES);
        
        let shoeTipL = applyBoneOffsetMesh(this.skeleton.footL, this.meshes.shoeTipMesh.solid.mesh, this.offsetMesh.shoeTipLOffset);
        drawObject(shoeTipL.buffers, shoeTipL.modelMatrix, C_BLUE, GL.TRIANGLES);
        let shoeTipR = applyBoneOffsetMesh(this.skeleton.footR, this.meshes.shoeTipMesh.solid.mesh, this.offsetMesh.shoeTipROffset);
        drawObject(shoeTipR.buffers, shoeTipR.modelMatrix, C_BLUE, GL.TRIANGLES);
    }
}