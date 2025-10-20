import { BaseCharacter } from '/process/BaseCharacter.js';
import { createModelMatrix, createMesh, drawObject, applyTransformToMesh, recenterMesh } from '../CreateObject.js';
import { MeshUtilsCurves, animateAlongCurve, rotateAroundAxis } from '../MeshUtilsCurves.js';
import { MeshUtils } from '../MeshUtils.js';
import * as Curves from '../curves.js';
import { makeModel } from "../bone.js";
import { GL, attribs } from '../main.js'
// Di bagian atas file mime_jr.js
import { setLocalRotationAxisAngle } from "../bone.js";
import { applyBoneOffsetMesh } from "../bone.js";


export class mime_jr extends BaseCharacter {
    constructor() {
        super();

        const bezierCurve = Curves.cubicBezier3D(
            [0, 0, 0],   // p0 (awal)
            [-2, 2, 0],   // p1 (kontrol 1)
            [0.5, 1.5, 0.5], // p2 (kontrol 2)
            [0.5, 1.5, 0.5], // p2 (kontrol 2)
        );

        // const mouthCurve = Curves.cubicBezier3D(
        //     [-0.5, 0, 0],    // p0 (titik awal, kiri)
        //     [-0.4, -0.3, 0], // p1 (kontrol 1, menarik kurva ke bawah)
        //     [0.4, -0.3, 0],  // p2 (kontrol 2, menarik kurva ke bawah)
        //     [0.5, 0, 0]      // p3 (titik akhir, kanan)
        // );


        // === PEMBUATAN MESH MULUT 2D SECARA MANUAL ===

        // 1. Definisikan dua kurva: bibir atas dan bawah
        const mouthUpperCurve = Curves.cubicBezier3D(
            [-0.5, 0, -0.04],    // p0 (kiri atas)
            [-0.4, -0.1, 0.05],   // p1 (kontrol)
            [0.4, -0.1, 0.07],    // p2 (kontrol)
            [0.5, 0, -0.04]      // p3 (kanan atas)
        );

        const mouthLowerCurve = Curves.cubicBezier3D(
            [-0.5, 0, -0.04],      // p0 (kiri bawah)
            [-0.4, -0.5, -0.05],  // p1 (kontrol)
            [0.4, -0.5, -0.01],   // p2 (kontrol)
            [0.5, 0, -0.04]        // p3 (kanan bawah)
        );

        const toungeUpperCurve = Curves.cubicBezier3D(
            [-0.2, 0, -0.04],    // p0 (kiri atas)
            [-0.1, 0.3, 0.05],   // p1 (kontrol)
            [0.1, 0.3, 0.07],    // p2 (kontrol)
            [0.2, 0, -0.04]      // p3 (kanan atas)
        );

        const toungeLowerCurve = Curves.cubicBezier3D(
            [-0.2, 0, -0.04],      // p0 (kiri bawah)
            [-0.1, -0.05, -0.05],  // p1 (kontrol)
            [0.1, -0.05, -0.01],   // p2 (kontrol)
            [0.2, 0, -0.04]        // p3 (kanan bawah)
        );

        // 2. Ambil sampel titik dari kedua kurva
        const mouthSegments = 30; // Jumlah segmen untuk kehalusan
        const upperPoints = [];
        const lowerPoints = [];
        const toungeupperPoints = [];
        const toungelowerPoints = [];
        for (let i = 0; i <= mouthSegments; i++) {
            const t = i / mouthSegments;
            upperPoints.push(mouthUpperCurve(t));
            lowerPoints.push(mouthLowerCurve(t));
            toungeupperPoints.push(toungeUpperCurve(t));
            toungelowerPoints.push(toungeLowerCurve(t));
        }

        // 3. Bangun array 'positions' dan 'indices' untuk mesh pengisi
        const mouthFillPositions = [];
        const mouthFillIndices = [];
        const toungeFillPositions = [];
        const toungeFillIndices = [];

        // Gabungkan semua titik ke dalam satu array posisi
        upperPoints.forEach(p => mouthFillPositions.push(...p));
        lowerPoints.forEach(p => mouthFillPositions.push(...p));

        toungeupperPoints.forEach(p => toungeFillPositions.push(...p));
        toungelowerPoints.forEach(p => toungeFillPositions.push(...p));

        // "Jahit" titik-titik menjadi segitiga (membuat 'quad strip')
        const numPointsPerCurve = mouthSegments + 1;
        for (let i = 0; i < mouthSegments; i++) {
            const topLeft = i;
            const topRight = i + 1;
            const bottomLeft = i + numPointsPerCurve;
            const bottomRight = i + 1 + numPointsPerCurve;

            // Segitiga pertama: kiri atas, kiri bawah, kanan atas
            mouthFillIndices.push(topLeft, bottomLeft, topRight);
            // Segitiga kedua: kiri bawah, kanan bawah, kanan atas
            mouthFillIndices.push(bottomLeft, bottomRight, topRight);
            // Segitiga pertama: kiri atas, kiri bawah, kanan atas
            toungeFillIndices.push(topLeft, bottomLeft, topRight);
            // Segitiga kedua: kiri bawah, kanan bawah, kanan atas
            toungeFillIndices.push(bottomLeft, bottomRight, topRight);
        }

        // Buat objek mesh mentah (raw mesh)
        const mouthFillRawMesh = {
            positions: new Float32Array(mouthFillPositions),
            // Kita bisa hitung normal agar pencahayaan tetap berfungsi
            normals: MeshUtils.computeNormals(new Float32Array(mouthFillPositions), mouthFillIndices),
            indices: new Uint16Array(mouthFillIndices)
        };
        const toungeFillRawMesh = {
            positions: new Float32Array(toungeFillPositions),
            // Kita bisa hitung normal agar pencahayaan tetap berfungsi
            normals: MeshUtils.computeNormals(new Float32Array(toungeFillPositions), toungeFillIndices),
            indices: new Uint16Array(toungeFillIndices)
        };

        //MESH 
        this.meshes = {
            // BODY and BALL
            bodyMesh: createMesh(MeshUtils.generateEllipticParaboloid, { params: [1, 1, 1, 1.5, 32, 16], deferBuffer: false }),
            ballMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.45, 0.45, 0.45, 32, 64], deferBuffer: false }),
            redDotBodyMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.3, 0.3, 0.3, 32, 64], deferBuffer: false }),

            // HEAD and HAIR
            headMesh: createMesh(MeshUtils.generateEllipsoid, { params: [1.4, 1.1, 1.4, 32, 64], deferBuffer: false }),
            leftHairMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.6, 0.7, 0.8, 32, 64], deferBuffer: false }),
            rightHairMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.6, 0.7, 0.8, 32, 64], deferBuffer: false }),
            backHairMesh: createMesh(MeshUtils.generateEllipsoid, { params: [1.5, 0.78, 1, 32, 64], deferBuffer: false }),
            topHairMesh: createMesh(MeshUtils.generateTorus, { params: [0.45, 0.9, 64, 64], deferBuffer: false }),
            hatCoverMesh: createMesh(MeshUtils.generateEllipticParaboloid, { params: [0.35, 0.35, 1, 0.4, 32, 16], deferBuffer: false }),
            coneHatMesh: createMesh(MeshUtils.generateCone, { params: [0.2, 1, 32], deferBuffer: false }),
            topHatMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.3, 0.3, 0.3, 32, 64], deferBuffer: false }),

            // NOSE and EYES
            noseMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.35, 0.3, 0.3, 32, 64], deferBuffer: false }),
            eyeMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.2, 0.3, 0.05, 32, 64], deferBuffer: false }),
            doteyeMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.05, 0.1, 0.005, 32, 64], deferBuffer: false }),

            // ARMS
            upperArmMesh: createMesh(MeshUtils.generateEllipticalCylinder, { params: [0.05, 0.05, 0.05, 0.05, 1.2], deferBuffer: false }),
            lowerArmMesh: createMesh(MeshUtils.generateEllipticalCylinder, { params: [0.05, 0.05, 0.05, 0.05, 0.7], deferBuffer: false }),
            armEngselMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.05, 0.05, 0.05, 32, 64], deferBuffer: false }),
            palmBaseMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.5, 0.1, 0.2, 32, 64], deferBuffer: false }),
            // upperPalmMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.3, 0.15, 0.2, 32, 64], deferBuffer: false }),

            //BOTTOM and LEGS
            legMesh: createMesh(MeshUtils.generateEllipticParaboloid, { params: [0.5, 0.5, 0.75, 1, 32, 16], deferBuffer: false }),
            legEngselMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.55, 0.55, 0.55, 32, 64], deferBuffer: false }),
            buttMesh: createMesh(MeshUtils.generateEllipsoid, { params: [1, 0.8, 1, 32, 64], deferBuffer: false }),

            // CURVES
            hatMesh: createMesh(MeshUtilsCurves.generateVariableTube,
                {
                    params: [bezierCurve, 0, 1, 50, [0.8, 0.5, 0.3, 0.2], 24], deferBuffer: false
                }),

            // mouthMesh: createMesh(MeshUtilsCurves.generateVariableTube, {
            //     params: [mouthCurve, 0, 1, 50, [0.05], 8], deferBuffer: false
            // }),

            // === MESH MULUT BARU ===
            mouthFillMesh: { solid: { mesh: mouthFillRawMesh, buffers: MeshUtils.createMeshBuffers(GL, mouthFillRawMesh, attribs) } },
            upperLipOutlineMesh: createMesh(MeshUtilsCurves.generateVariableTube, {
                params: [mouthUpperCurve, 0, 1, mouthSegments, [0.002], 8], // Sangat tipis
                deferBuffer: false
            }),
            lowerLipOutlineMesh: createMesh(MeshUtilsCurves.generateVariableTube, {
                params: [mouthLowerCurve, 0, 1, mouthSegments, [0.002], 8], // Sangat tipis
                deferBuffer: false
            }),

            // TOUNGE
            toungeFillMesh: { solid: { mesh: toungeFillRawMesh, buffers: MeshUtils.createMeshBuffers(GL, toungeFillRawMesh, attribs) } },
            upperToungeOutlineMesh: createMesh(MeshUtilsCurves.generateVariableTube, {
                params: [toungeUpperCurve, 0, 1, mouthSegments, [0.002], 8], // Sangat tipis
                deferBuffer: false
            }),
            lowerToungeOutlineMesh: createMesh(MeshUtilsCurves.generateVariableTube, {
                params: [toungeLowerCurve, 0, 1, mouthSegments, [0.002], 8], // Sangat tipis
                deferBuffer: false
            }),

            // #6 Buffer mesh hasil mesh ke GPU
            // holeOnCubeMesh: MeshUtils.createMeshBuffers(GL, holeOnCubeMesh, attribs)

        }

        this.skeleton = {
            neck: this.createBone("neck", null, { translate: [0, 0, 0] }),
            head: this.createBone("head", "neck", { translate: [0, 0.9, 0] }),

            //HAIR
            lefthair: this.createBone("lefthair", "head", { translate: [1.4, 0, 0] }),
            righthair: this.createBone("righthair", "head", { translate: [-1.4, 0, 0] }),
            backhair: this.createBone("backhair", "head", { translate: [0, 0, -0.8] }),
            tophair: this.createBone("tophair", "head", { translate: [0, 0.78, -0.1] }),

            //NOSE and MOUTH
            nose: this.createBone("nose", "head", { translate: [0, -0.1, 1.4] }),
            // Di dalam this.skeleton
            mouth: this.createBone("mouth", "head", { translate: [0, -0.5, 1.2] }),
            tongue: this.createBone("tongue", "mouth", { translate: [0, -0.3, -0.14] }),

            //EYES
            lefteye: this.createBone("lefteye", "head", { translate: [-0.7, 0, 1.2] }),
            righteye: this.createBone("righteye", "head", { translate: [0.7, 0, 1.2] }),
            leftdotteye: this.createBone("leftdoteye", "lefteye", { translate: [0, 0, 0.06] }),
            rightdotteye: this.createBone("rightdoteye", "righteye", { translate: [0, 0, 0.06] }),

            //SHOULDER n ARM
            shoulder: this.createBone("shoulder", "neck", { translate: [0, -0.3, 0] }),
            hip: this.createBone("hip", "shoulder", { translate: [0, -1., 0] }),
            leftUpperArm: this.createBone("leftUpperArm", "shoulder", { translate: [-0.5, 0, 0] }),
            rightUpperArm: this.createBone("rightUpperArm", "shoulder", { translate: [0.5, 0, 0] }),
            leftLowerArm: this.createBone("leftLowerArm", "leftUpperArm", { translate: [-1.1, 0, 0] }),
            rightLowerArm: this.createBone("rightLowerArm", "rightUpperArm", { translate: [1.1, 0, 0] }),
            leftPalmArm: this.createBone("leftPalmArm", "leftLowerArm", { translate: [-0.67, 0, 0] }),
            rightPalmArm: this.createBone("rightPalmArm", "rightLowerArm", { translate: [0.67, 0, 0] }),

            // BALL BODY
            ball1: this.createBone("ball", "hip", { translate: [-0.4, 0, 1] }),
            ball2: this.createBone("ball", "hip", { translate: [0.4, 0, 1] }),
            ball3: this.createBone("ball", "hip", { translate: [-1, 0, 0.42] }),
            ball4: this.createBone("ball", "hip", { translate: [1, 0, 0.42] }),
            ball5: this.createBone("ball", "hip", { translate: [0.9, 0, -0.4] }),
            ball6: this.createBone("ball", "hip", { translate: [-0.9, 0, -0.4] }),
            ball7: this.createBone("ball", "hip", { translate: [0.4, 0, -1] }),
            ball8: this.createBone("ball", "hip", { translate: [-0.4, 0, -1] }),

            // BOTTOM and LEG
            butt: this.createBone("butt", "hip", { translate: [0, -0.1, 0] }),
            leftLeg: this.createBone("leftLeg", "butt", { translate: [-0.5, -0.5, 0] }),
            rightLeg: this.createBone("rightLeg", "butt", { translate: [0.5, -0.5, 0] }),
            hat: this.createBone("hat", "tophair", { translate: [0, 0.1, -0.3] }),



        }
        

        this.updateWorld();

        this.offsetMesh = {
            //BODY and BALL
            bodyOffset: createModelMatrix({
                translate: [0, 0.3, 0], rotate: [
                    { axis: "x", angle: Math.PI / 2 },] // rotasi 90° sumbu X
            }),
            ballOffset: createModelMatrix({ translate: [0, 0, 0] }),
            leftUpperArmOffset: createModelMatrix({
                translate: [-0.5, 0, 0], rotate: [
                    { axis: "z", angle: Math.PI / 2 },
                ]
            }),
            redDotBodyOffset: createModelMatrix({ translate: [0, 0.6, 0.8] }),


            //HEAD and HAIR
            headOffset: createModelMatrix({ translate: [0, 0, 0] }),
            lefthairOffset: createModelMatrix({ translate: [0, 0, 0] }),
            righthairOffset: createModelMatrix({ translate: [0, 0, 0] }),
            backhairOffset: createModelMatrix({ translate: [0, 0, 0] }),
            tophairOffset: createModelMatrix({ translate: [0, 0, 0] }),

            // HAT
            hatOffset: createModelMatrix({
                translate: [0, 0, 0], rotate: [
                    { axis: "y", angle: Math.PI / 2 },
                ]
            }),
            hatCoverOffset: createModelMatrix({
                translate: [0.54, 1.51, -0.88], rotate: [
                    { axis: "y", angle: -Math.PI / 25 },
                    { axis: "z", angle: Math.PI / 30 }
                ]
            }),
            hatConeOffset: createModelMatrix({
                translate: [0.52, 1.51, -0.62], rotate: [
                    { axis: "x", angle: Math.PI / 10 },
                ]
            }),
            topHatOffset: createModelMatrix({
                translate: [0.5, 2.5, -0.35]
            }),


            // NOSE and EYES
            noseOffset: createModelMatrix({ translate: [0, 0, 0] }),
            lefteyeOffset: createModelMatrix({
                translate: [0, 0, 0], rotate: [
                    { axis: "y", angle: -Math.PI / 6 },
                ]
            }),
            righteyeOffset: createModelMatrix({
                translate: [0, 0, 0], rotate: [
                    { axis: "y", angle: Math.PI / 6 },
                ]
            }),
            leftdoteyeOffset: createModelMatrix({
                translate: [0, 0, 0], rotate: [
                    { axis: "y", angle: -Math.PI / 6 },
                ]
            }),
            rightdoteyeOffset: createModelMatrix({
                translate: [0, 0, 0], rotate: [
                    { axis: "y", angle: Math.PI / 6 },
                ]
            }),
            mouthOffset: createModelMatrix({
                translate: [0, 0, 0], rotate: [
                    { axis: "x", angle: Math.PI / 6 },
                ]
            }),
            tongueOffset: createModelMatrix({
                translate: [0, 0, -0.02], rotate: [
                    { axis: "x", angle: Math.PI / 6 },
                ]
            }),

            // ARMS
            leftLowerArmOffset: createModelMatrix({
                translate: [-0.3, 0, 0], rotate: [
                    { axis: "z", angle: Math.PI / 2 },
                ]
            }),
            rightUpperArmOffset: createModelMatrix({
                translate: [0.5, 0, 0], rotate: [
                    { axis: "z", angle: Math.PI / 2 },
                ]
            }),
            rightLowerArmOffset: createModelMatrix({
                translate: [0.3, 0, 0], rotate: [
                    { axis: "z", angle: Math.PI / 2 },
                ]
            }),
            leftUpperArmEngselOffset: createModelMatrix({ translate: [0.1, 0, 0] }),
            rightUpperArmEngselOffset: createModelMatrix({ translate: [-0.1, 0, 0] }),

            leftLowerArmEngselOffset: createModelMatrix({ translate: [-1.1, 0, 0] }),
            rightLowerArmEngselOffset: createModelMatrix({ translate: [1.1, 0, 0] }),

            leftPalmArmEngselOffset: createModelMatrix({ translate: [-0.66, 0, 0] }),
            rightPalmArmEngselOffset: createModelMatrix({ translate: [0.66, 0, 0] }),

            leftPalmOffset: createModelMatrix({ translate: [-0.45, 0, 0] }),
            rightPalmOffset: createModelMatrix({ translate: [0.45, 0, 0] }),
            // leftUpperPalmOffset: createModelMatrix({translate: [-0.6,0.,0]}),
            // rightUpperPalmOffset: createModelMatrix({translate: [0.45,0,0]}),

            // BOTTOM and LEGS
            buttOffset: createModelMatrix({
                translate: [0, 0, 0],
            }),

            leftLegOffset: createModelMatrix({
                translate: [0, -0.8, 0], rotate: [
                    { axis: "x", angle: -Math.PI / 2 },
                ]
            }),
            rightLegOffset: createModelMatrix({
                translate: [0, -0.8, 0], rotate: [
                    { axis: "x", angle: -Math.PI / 2 },
                ]
            }),

            leftLegEngselOffset: createModelMatrix({
                translate: [0, 0.2, 0]
            }),
            rightLegEngselOffset: createModelMatrix({
                translate: [0, 0.2, 0]
            }),


        }
    }

   animate(time) {
    // Total durasi untuk satu siklus animasi (misalnya 4000ms atau 4 detik)
    const duration = 12000;

    // Buat 't' sebagai nilai yang berulang dari 0.0 hingga 1.0 sesuai durasi
    const t = (time % duration) / duration;

    // Tentukan sudut maksimum untuk gerakan
    const maxArmAngle = Math.PI / 10; // Lengan naik 90 derajat
    const maxArmForwardAngle = Math.PI / 4;
    const maxLegAngle = -Math.PI / 4; // Kaki kanan ke belakang 72 derajat
    const maxPalmAngle = Math.PI / 2;
    // --- TAMBAHAN BARU: Sudut maksimal tubuh condong ke depan ---
    const maxBodyTiltAngle = Math.PI / 10; // Condong sekitar 15 derajat

    // Definisikan batas waktu untuk setiap fase (dalam skala 0.0 - 1.0)
    const phase1End = 2 / 12;  // 2 detik
    const phase2End = 6 / 12;  // 2 + 4 detik
    const phase3End = 10 / 12; // 6 + 4 detik

    // --- Logika Fase Animasi ---
    if (t < phase1End) {
        // === FASE 1: 0 -> 2 detik (Angkat Lengan & Kaki) ===
        const phaseT = t / phase1End;
        const smoothProgress = Math.sin(phaseT * Math.PI / 2);

        const currentArmAngle = smoothProgress * maxArmAngle;
        const currentLegAngle = smoothProgress * maxLegAngle;

        // Terapkan rotasi ke tulang yang sesuai
        setLocalRotationAxisAngle(this.skeleton.leftUpperArm, 'z', -currentArmAngle);
        setLocalRotationAxisAngle(this.skeleton.rightUpperArm, 'z', currentArmAngle);
        setLocalRotationAxisAngle(this.skeleton.leftLowerArm, 'z', -currentArmAngle);
        setLocalRotationAxisAngle(this.skeleton.rightLowerArm, 'z', currentArmAngle);
        setLocalRotationAxisAngle(this.skeleton.leftPalmArm, 'z', -currentArmAngle);
        setLocalRotationAxisAngle(this.skeleton.rightPalmArm, 'z', currentArmAngle);
        setLocalRotationAxisAngle(this.skeleton.rightLeg, 'x', -currentLegAngle); // Arahnya sudah benar dari maxLegAngle

        // Pastikan rotasi badan tetap 0 di fase ini
        setLocalRotationAxisAngle(this.skeleton.neck, 'y', 0);
        // === PERBAIKAN: Gunakan 'shoulder' untuk memastikan tubuh tegak ===
        setLocalRotationAxisAngle(this.skeleton.shoulder, 'x', 0);

    } else if (t < phase2End) {
        // === FASE 2: 2 -> 6 detik (Putaran Pertama + Condong ke Depan) ===
        const phaseT = (t - phase1End) / (phase2End - phase1End);
        
        // === PERBAIKAN: Gunakan 'shoulder' untuk condong ke depan ===
        const smoothTiltProgress = Math.sin(phaseT * Math.PI / 2);
        const currentBodyTilt = smoothTiltProgress * maxBodyTiltAngle;
        setLocalRotationAxisAngle(this.skeleton.shoulder, 'x', currentBodyTilt);

        // Berputar 2 kali (4 * PI)
        const bodyRotation = phaseT * 4 * Math.PI;

        // Kunci posisi lengan dan kaki tetap terangkat
        setLocalRotationAxisAngle(this.skeleton.leftUpperArm, 'z', -maxArmAngle);
        setLocalRotationAxisAngle(this.skeleton.rightUpperArm, 'z', maxArmAngle);
        setLocalRotationAxisAngle(this.skeleton.leftLowerArm, 'z', -maxArmAngle);
        setLocalRotationAxisAngle(this.skeleton.rightLowerArm, 'z', maxArmAngle);
        setLocalRotationAxisAngle(this.skeleton.leftPalmArm, 'z', -maxArmAngle);
        setLocalRotationAxisAngle(this.skeleton.rightPalmArm, 'z', maxArmAngle);
        setLocalRotationAxisAngle(this.skeleton.rightLeg, 'x', -maxLegAngle);

        // Terapkan rotasi badan
        setLocalRotationAxisAngle(this.skeleton.neck, 'y', bodyRotation);

    } else if (t < phase3End) {
        // === FASE 3: 6 -> 10 detik (Putaran Kedua + Transisi Lengan + Tubuh Tegak) ===
        const phaseT = (t - phase2End) / (phase3End - phase2End);
        const smoothProgress = Math.sin(phaseT * Math.PI / 2);

        // === PERBAIKAN: Gunakan 'shoulder' untuk tegak kembali ===
        const currentBodyTilt = (1 - smoothProgress) * maxBodyTiltAngle;
        setLocalRotationAxisAngle(this.skeleton.shoulder, 'x', currentBodyTilt);

        // Lanjutkan putaran dari 2x ke 4x (dari 4*PI ke 8*PI)
        const bodyRotation = (4 * Math.PI) + (phaseT * 4 * Math.PI);

        // Sambil berputar, lengan turun dan bergerak maju
        const currentArmAngle = (1 - smoothProgress) * maxArmAngle;
        const currentArmForwardAngle = smoothProgress * maxArmForwardAngle;
        const currentPalmAngle = smoothProgress * maxPalmAngle;

        // Terapkan gerakan lengan turun (Z-axis)
        setLocalRotationAxisAngle(this.skeleton.leftUpperArm, 'z', -currentArmAngle);
        setLocalRotationAxisAngle(this.skeleton.rightUpperArm, 'z', currentArmAngle);
        setLocalRotationAxisAngle(this.skeleton.leftLowerArm, 'z', -currentArmAngle);
        setLocalRotationAxisAngle(this.skeleton.rightLowerArm, 'z', currentArmAngle);
        setLocalRotationAxisAngle(this.skeleton.leftPalmArm, 'z', -currentArmAngle);
        setLocalRotationAxisAngle(this.skeleton.rightPalmArm, 'z', currentArmAngle);

        // Terapkan gerakan lengan maju (Y-axis)
        setLocalRotationAxisAngle(this.skeleton.leftUpperArm, 'y', currentArmForwardAngle);
        setLocalRotationAxisAngle(this.skeleton.rightUpperArm, 'y', -currentArmForwardAngle);
        setLocalRotationAxisAngle(this.skeleton.leftLowerArm, 'y', currentArmForwardAngle);
        setLocalRotationAxisAngle(this.skeleton.rightLowerArm, 'y', -currentArmForwardAngle);
        setLocalRotationAxisAngle(this.skeleton.leftPalmArm, 'y', currentArmForwardAngle);
        setLocalRotationAxisAngle(this.skeleton.rightPalmArm, 'y', -currentArmForwardAngle);

        setLocalRotationAxisAngle(this.skeleton.leftPalmArm, 'x', currentPalmAngle);
        setLocalRotationAxisAngle(this.skeleton.rightPalmArm, 'x', -currentPalmAngle);

        // Kunci posisi kaki tetap terangkat
        setLocalRotationAxisAngle(this.skeleton.rightLeg, 'x', -maxLegAngle);

        // Terapkan rotasi badan
        setLocalRotationAxisAngle(this.skeleton.neck, 'y', bodyRotation);

    } else {
        // === FASE 4: 10 -> 12 detik (Reset Posisi) ===
        const phaseT = (t - phase3End) / (1 - phase3End);
        const smoothProgress = Math.sin(phaseT * Math.PI / 2);

        // Kaki turun dan Tangan kembali ke samping
        const currentLegAngle = (1 - smoothProgress) * maxLegAngle;
        const currentArmForwardAngle = (1 - smoothProgress) * maxArmForwardAngle;
        const currentPalmAngle = (1 - smoothProgress) * maxPalmAngle;

        // Kunci lengan di posisi bawah (Z-axis = 0)
        setLocalRotationAxisAngle(this.skeleton.leftUpperArm, 'z', 0);
        setLocalRotationAxisAngle(this.skeleton.rightUpperArm, 'z', 0);

        // Gerakkan lengan kembali ke samping (Y-axis)
        setLocalRotationAxisAngle(this.skeleton.leftUpperArm, 'y', currentArmForwardAngle);
        setLocalRotationAxisAngle(this.skeleton.rightUpperArm, 'y', -currentArmForwardAngle);
        setLocalRotationAxisAngle(this.skeleton.leftLowerArm, 'y', currentArmForwardAngle);
        setLocalRotationAxisAngle(this.skeleton.rightLowerArm, 'y', -currentArmForwardAngle);
        setLocalRotationAxisAngle(this.skeleton.leftPalmArm, 'y', currentArmForwardAngle);
        setLocalRotationAxisAngle(this.skeleton.rightPalmArm, 'y', -currentArmForwardAngle);

        setLocalRotationAxisAngle(this.skeleton.leftPalmArm, 'x', currentPalmAngle);
        setLocalRotationAxisAngle(this.skeleton.rightPalmArm, 'x', -currentPalmAngle);
        
        // Gerakkan kaki turun
        setLocalRotationAxisAngle(this.skeleton.rightLeg, 'x', currentLegAngle);

        // Pastikan badan berhenti berputar dan menghadap depan
        setLocalRotationAxisAngle(this.skeleton.neck, 'y', 0); // Reset ke 0
        // === PERBAIKAN: Gunakan 'shoulder' untuk memastikan tubuh tegak sempurna ===
        setLocalRotationAxisAngle(this.skeleton.shoulder, 'x', 0);
    }

    // 💡 PENTING! Selalu panggil updateWorld() setelah memodifikasi tulang
    this.updateWorld();
}


    drawObject() {

        // BODY
        let body = applyBoneOffsetMesh(this.skeleton.shoulder, this.meshes.bodyMesh.solid.mesh, this.offsetMesh.bodyOffset);
        drawObject(body.buffers, body.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES)

        // HEAD AND HAIR
        let head = applyBoneOffsetMesh(this.skeleton.head, this.meshes.headMesh.solid.mesh, this.offsetMesh.headOffset);
        drawObject(head.buffers, head.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let leftHair = applyBoneOffsetMesh(this.skeleton.lefthair, this.meshes.leftHairMesh.solid.mesh, this.offsetMesh.lefthairOffset);
        drawObject(leftHair.buffers, leftHair.modelMatrix, [0.157, 0.392, 0.522], GL.TRIANGLES);

        let rightHair = applyBoneOffsetMesh(this.skeleton.righthair, this.meshes.rightHairMesh.solid.mesh, this.offsetMesh.righthairOffset);
        drawObject(rightHair.buffers, rightHair.modelMatrix, [0.157, 0.392, 0.522], GL.TRIANGLES);

        let backHair = applyBoneOffsetMesh(this.skeleton.backhair, this.meshes.backHairMesh.solid.mesh, this.offsetMesh.backhairOffset);
        drawObject(backHair.buffers, backHair.modelMatrix, [0.157, 0.392, 0.522], GL.TRIANGLES);

        let topHair = applyBoneOffsetMesh(this.skeleton.tophair, this.meshes.topHairMesh.solid.mesh, this.offsetMesh.tophairOffset);
        drawObject(topHair.buffers, topHair.modelMatrix, [0.157, 0.392, 0.522], GL.TRIANGLES);

        let hat = applyBoneOffsetMesh(this.skeleton.hat, this.meshes.hatMesh.solid.mesh, this.offsetMesh.hatOffset);
        drawObject(hat.buffers, hat.modelMatrix, [0.157, 0.392, 0.522], GL.TRIANGLES);

        let hatCover = applyBoneOffsetMesh(this.skeleton.hat, this.meshes.hatCoverMesh.solid.mesh, this.offsetMesh.hatCoverOffset);
        drawObject(hatCover.buffers, hatCover.modelMatrix, [0.157, 0.392, 0.522], GL.TRIANGLES);

        let coneHat = applyBoneOffsetMesh(this.skeleton.hat, this.meshes.coneHatMesh.solid.mesh, this.offsetMesh.hatConeOffset);
        drawObject(coneHat.buffers, coneHat.modelMatrix, [0.157, 0.392, 0.522], GL.TRIANGLES);

        let topHat = applyBoneOffsetMesh(this.skeleton.hat, this.meshes.topHatMesh.solid.mesh, this.offsetMesh.topHatOffset);
        drawObject(topHat.buffers, topHat.modelMatrix, [1, 1, 1], GL.TRIANGLES);

        // NOSE
        let nose = applyBoneOffsetMesh(this.skeleton.nose, this.meshes.noseMesh.solid.mesh, this.offsetMesh.noseOffset);
        drawObject(nose.buffers, nose.modelMatrix, [1, 0.3, 0.46], GL.TRIANGLES);

        // === GAMBAR MULUT 2D ===
        const mouthModel = makeModel(this.skeleton.mouth, this.offsetMesh.mouthOffset);

        // 1. Gambar isian mulut (warna merah gelap)
        drawObject(this.meshes.mouthFillMesh.solid.buffers, mouthModel, [0.51, 0.153, 0.235], GL.TRIANGLES);

        // 2. Gambar garis bibir atas (warna hitam/gelap)
        drawObject(this.meshes.upperLipOutlineMesh.solid.buffers, mouthModel, [0.314, 0.137, 0.176], GL.TRIANGLES);

        // 3. Gambar garis bibir bawah (warna hitam/gelap)
        drawObject(this.meshes.lowerLipOutlineMesh.solid.buffers, mouthModel, [0.314, 0.137, 0.176], GL.TRIANGLES);

        // === GAMBAR TONGUE 2D ===
        const tongueModel = makeModel(this.skeleton.tongue, this.offsetMesh.tongueOffset);

        // 1. Gambar isian mulut (warna merah gelap)
        drawObject(this.meshes.toungeFillMesh.solid.buffers, tongueModel, [1, 0.38, 0.584], GL.TRIANGLES);

        // 2. Gambar garis bibir atas (warna hitam/gelap)
        drawObject(this.meshes.upperToungeOutlineMesh.solid.buffers, tongueModel, [1, 0.38, 0.584], GL.TRIANGLES);

        // 3. Gambar garis bibir bawah (warna hitam/gelap)
        drawObject(this.meshes.lowerToungeOutlineMesh.solid.buffers, tongueModel, [1, 0.38, 0.584], GL.TRIANGLES);



        // EYES
        let leftEye = applyBoneOffsetMesh(this.skeleton.lefteye, this.meshes.eyeMesh.solid.mesh, this.offsetMesh.lefteyeOffset);
        drawObject(leftEye.buffers, leftEye.modelMatrix, [0, 0, 0], GL.TRIANGLES);

        let rightEye = applyBoneOffsetMesh(this.skeleton.righteye, this.meshes.eyeMesh.solid.mesh, this.offsetMesh.righteyeOffset);
        drawObject(rightEye.buffers, rightEye.modelMatrix, [0, 0, 0], GL.TRIANGLES);

        let leftDotEye = applyBoneOffsetMesh(this.skeleton.leftdotteye, this.meshes.doteyeMesh.solid.mesh, this.offsetMesh.leftdoteyeOffset);
        drawObject(leftDotEye.buffers, leftDotEye.modelMatrix, [1, 1, 1], GL.TRIANGLES);

        let rightDotEye = applyBoneOffsetMesh(this.skeleton.rightdotteye, this.meshes.doteyeMesh.solid.mesh, this.offsetMesh.rightdoteyeOffset);
        drawObject(rightDotEye.buffers, rightDotEye.modelMatrix, [1, 1, 1], GL.TRIANGLES);

        // BODY BALL
        let ball1 = applyBoneOffsetMesh(this.skeleton.ball1, this.meshes.ballMesh.solid.mesh, this.offsetMesh.ballOffset);
        drawObject(ball1.buffers, ball1.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let ball2 = applyBoneOffsetMesh(this.skeleton.ball2, this.meshes.ballMesh.solid.mesh, this.offsetMesh.ballOffset);
        drawObject(ball2.buffers, ball2.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let ball3 = applyBoneOffsetMesh(this.skeleton.ball3, this.meshes.ballMesh.solid.mesh, this.offsetMesh.ballOffset);
        drawObject(ball3.buffers, ball3.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let ball4 = applyBoneOffsetMesh(this.skeleton.ball4, this.meshes.ballMesh.solid.mesh, this.offsetMesh.ballOffset);
        drawObject(ball4.buffers, ball4.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let ball5 = applyBoneOffsetMesh(this.skeleton.ball5, this.meshes.ballMesh.solid.mesh, this.offsetMesh.ballOffset);
        drawObject(ball5.buffers, ball5.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let ball6 = applyBoneOffsetMesh(this.skeleton.ball6, this.meshes.ballMesh.solid.mesh, this.offsetMesh.ballOffset);
        drawObject(ball6.buffers, ball6.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let ball7 = applyBoneOffsetMesh(this.skeleton.ball7, this.meshes.ballMesh.solid.mesh, this.offsetMesh.ballOffset);
        drawObject(ball7.buffers, ball7.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let ball8 = applyBoneOffsetMesh(this.skeleton.ball8, this.meshes.ballMesh.solid.mesh, this.offsetMesh.ballOffset);
        drawObject(ball8.buffers, ball8.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let hip = applyBoneOffsetMesh(this.skeleton.hip, this.meshes.redDotBodyMesh.solid.mesh, this.offsetMesh.redDotBodyOffset);
        drawObject(hip.buffers, hip.modelMatrix, [1, 0.3, 0.46], GL.TRIANGLES);

        // ARMS
        let leftUpperArm = applyBoneOffsetMesh(this.skeleton.leftUpperArm, this.meshes.upperArmMesh.solid.mesh, this.offsetMesh.leftUpperArmOffset);
        drawObject(leftUpperArm.buffers, leftUpperArm.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let rightUpperArm = applyBoneOffsetMesh(this.skeleton.rightUpperArm, this.meshes.upperArmMesh.solid.mesh, this.offsetMesh.rightUpperArmOffset);
        drawObject(rightUpperArm.buffers, rightUpperArm.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let leftLowerArm = applyBoneOffsetMesh(this.skeleton.leftLowerArm, this.meshes.lowerArmMesh.solid.mesh, this.offsetMesh.leftLowerArmOffset);
        drawObject(leftLowerArm.buffers, leftLowerArm.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let rightLowerArm = applyBoneOffsetMesh(this.skeleton.rightLowerArm, this.meshes.lowerArmMesh.solid.mesh, this.offsetMesh.rightLowerArmOffset);
        drawObject(rightLowerArm.buffers, rightLowerArm.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let leftUpperEngsel = applyBoneOffsetMesh(this.skeleton.leftUpperArm, this.meshes.armEngselMesh.solid.mesh, this.offsetMesh.leftUpperArmEngselOffset);
        drawObject(leftUpperEngsel.buffers, leftUpperEngsel.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let rightUpperEngsel = applyBoneOffsetMesh(this.skeleton.rightUpperArm, this.meshes.armEngselMesh.solid.mesh, this.offsetMesh.rightUpperArmEngselOffset);
        drawObject(rightUpperEngsel.buffers, rightUpperEngsel.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let leftLowerEngsel = applyBoneOffsetMesh(this.skeleton.leftUpperArm, this.meshes.armEngselMesh.solid.mesh, this.offsetMesh.leftLowerArmEngselOffset);
        drawObject(leftLowerEngsel.buffers, leftLowerEngsel.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let rightLowerEngsel = applyBoneOffsetMesh(this.skeleton.rightUpperArm, this.meshes.armEngselMesh.solid.mesh, this.offsetMesh.rightLowerArmEngselOffset);
        drawObject(rightLowerEngsel.buffers, rightLowerEngsel.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let leftPalmEngsel = applyBoneOffsetMesh(this.skeleton.leftLowerArm, this.meshes.armEngselMesh.solid.mesh, this.offsetMesh.leftPalmArmEngselOffset);
        drawObject(leftPalmEngsel.buffers, leftPalmEngsel.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let rightPalmEngsel = applyBoneOffsetMesh(this.skeleton.rightLowerArm, this.meshes.armEngselMesh.solid.mesh, this.offsetMesh.rightPalmArmEngselOffset);
        drawObject(rightPalmEngsel.buffers, rightPalmEngsel.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let leftPalm = applyBoneOffsetMesh(this.skeleton.leftPalmArm, this.meshes.palmBaseMesh.solid.mesh, this.offsetMesh.leftPalmOffset);
        drawObject(leftPalm.buffers, leftPalm.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        let rightPalm = applyBoneOffsetMesh(this.skeleton.rightPalmArm, this.meshes.palmBaseMesh.solid.mesh, this.offsetMesh.rightPalmOffset);
        drawObject(rightPalm.buffers, rightPalm.modelMatrix, [1, 0.78, 0.94], GL.TRIANGLES);

        // BOTTOM AND LEG
        let butt = applyBoneOffsetMesh(this.skeleton.butt, this.meshes.buttMesh.solid.mesh, this.offsetMesh.buttOffset);
        drawObject(butt.buffers, butt.modelMatrix, [0.157, 0.392, 0.522], GL.TRIANGLES);

        let leftLeg = applyBoneOffsetMesh(this.skeleton.leftLeg, this.meshes.legMesh.solid.mesh, this.offsetMesh.leftLegOffset);
        drawObject(leftLeg.buffers, leftLeg.modelMatrix, [0.157, 0.392, 0.522], GL.TRIANGLES);

        let rightLeg = applyBoneOffsetMesh(this.skeleton.rightLeg, this.meshes.legMesh.solid.mesh, this.offsetMesh.rightLegOffset);
        drawObject(rightLeg.buffers, rightLeg.modelMatrix, [0.157, 0.392, 0.522], GL.TRIANGLES);

        let leftLegEngsel = applyBoneOffsetMesh(this.skeleton.leftLeg, this.meshes.legEngselMesh.solid.mesh, this.offsetMesh.leftLegEngselOffset);
        drawObject(leftLegEngsel.buffers, leftLegEngsel.modelMatrix, [0.157, 0.392, 0.522], GL.TRIANGLES);
        let rightLegEngsel = applyBoneOffsetMesh(this.skeleton.rightLeg, this.meshes.legEngselMesh.solid.mesh, this.offsetMesh.rightLegEngselOffset);
        drawObject(rightLegEngsel.buffers, rightLegEngsel.modelMatrix, [0.157, 0.392, 0.522], GL.TRIANGLES);


    }
}