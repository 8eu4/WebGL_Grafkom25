import { BaseCharacter } from '/process/BaseCharacter.js';
import { createModelMatrix, createMesh, drawObject, applyTransformToMesh, recenterMesh } from '../CreateObject.js';
import { MeshUtilsCurves } from '../MeshUtilsCurves.js';
import { MeshUtils } from '../MeshUtils.js';
import * as Curves from '../curves.js';
import { makeModel } from "../bone.js";
import { GL, attribs } from '../main.js'

// --- Ambil alias glMatrix dari scope global (window) ---
const vec3 = window.vec3;
const mat4 = window.mat4;
// --- BATAS PERBAIKAN ---

export class env extends BaseCharacter {
    constructor() {
        super();
        this.meshes = {};
        this.models = {};

        const CIRCUS_WIDTH = 300; // Lebar total (X-axis). Semula 200
        const CIRCUS_DEPTH = 200; // Kedalaman total (Z-axis). Semula 150

        const HALF_WIDTH = CIRCUS_WIDTH / 2;
        const HALF_DEPTH = CIRCUS_DEPTH / 2;

        const TRIBUNE_WIDTH = CIRCUS_WIDTH * 0.8; // Lebar tribun 80% dari lebar sirkus
        const TRIBUNE_DEPTH = CIRCUS_DEPTH * 0.8; // Kedalaman tribun 80% dari kedalaman sirkus

        // Tentukan jarak tribun dari dinding
        const standMarginX = (CIRCUS_WIDTH - TRIBUNE_WIDTH) / 2; // Jarak tribun dari dinding X
        const standMarginZ = (CIRCUS_DEPTH - TRIBUNE_DEPTH) / 2; // Jarak tribun dari dinding Z

        // 1. GEOMETRI DASAR PANGGUNG
        this.meshes.stageFloor = createMesh(MeshUtils.generateBox, { params: [60, 0.5, 25], deferBuffer: false });
        this.models.stageFloor = createModelMatrix({ translate: [0, -3, 0] });

        this.meshes.woodPlank = createMesh(MeshUtils.generateBox, { params: [60, 0.2, 0.9], deferBuffer: false });
        this.models.planks = [];
        const plankCount = 25;
        for (let i = 0; i < plankCount; i++) {
            const zPos = -12 + i * 1.0;
            this.models.planks.push(createModelMatrix({ translate: [0, -2.6, zPos] }));
        }

        // Di dalam constructor(), setelah this.models.grassField = ...

        // 7. DINDING LANGIT
        this.meshes.skyWall = createMesh(MeshUtils.generateBox, { params: [500, 200, 1], deferBuffer: false }); // Panjang 400, Tinggi 200

        const skyWallY = 100 - 3.7; // Posisi vertikal agar pas dengan alas rumput

        this.models.skyWallBack = createModelMatrix({ translate: [0, skyWallY, -250] });
        this.models.skyWallFront = createModelMatrix({ translate: [0, skyWallY, 250] });
        this.models.skyWallLeft = createModelMatrix({
            translate: [-250, skyWallY, 0],
            rotate: [{ axis: 'y', angle: Math.PI / 2 }]
        });
        this.models.skyWallRight = createModelMatrix({
            translate: [250, skyWallY, 0],
            rotate: [{ axis: 'y', angle: Math.PI / 2 }]
        });
        
        // --- TAMBAHAN ATAP LANGIT ---
        this.meshes.skyRoof = createMesh(MeshUtils.generateBox, { params: [500, 1, 500], deferBuffer: false }); // 500x1x500 plane
        const skyRoofY = skyWallY + 100; // Y-center wall (96.3) + half-height wall (100) = 196.3
        this.models.skyRoof = createModelMatrix({ translate: [0, skyRoofY, 0] });
        // --- AKHIR TAMBAHAN ---

        // 6. LAPANGAN HIJAU DI LUAR
        this.meshes.grassField = createMesh(MeshUtils.generateBox, { params: [500, 0.2, 500], deferBuffer: false });
        this.models.grassField = createModelMatrix({ translate: [0, -3.7, 0] }); // Posisikan di bawah alas krem

        this.meshes.basePlane = createMesh(MeshUtils.generateBox, { params: [CIRCUS_WIDTH, 0.2, CIRCUS_DEPTH], deferBuffer: false });

        // 5. DINDING SIRKUS
        this.meshes.wallPanel = createMesh(MeshUtils.generateBox, { params: [5, 60, 1], deferBuffer: false }); // Lebar panel 5, tinggi 25
        this.models.wallPanels = [];

        const wallHeight = 28.5; // Setengah dari tinggi panel, untuk penempatan Y
        const wallColors = [
            [0.8, 0.15, 0.15], // Merah
            [0.9, 0.9, 0.85]   // Putih Gading
        ];
        const panelWidth = 5;
        const doorStart = HALF_WIDTH - 40; //  Posisi X di mana pintu dimulai
        const doorEnd = HALF_WIDTH - 25;   // Posisi X di mana pintu berakhir

        // Dinding Belakang (Z = -75)
        for (let x = -HALF_WIDTH; x < HALF_WIDTH; x += panelWidth) {
            const color = wallColors[Math.abs(Math.floor(x / panelWidth)) % 2];
            const model = createModelMatrix({ translate: [x + panelWidth / 2, wallHeight - 3.5, -HALF_DEPTH] });
            this.models.wallPanels.push({ model, color });
        }

        // Dinding Depan (Z = 75) - dengan celah pintu
        for (let x = -HALF_WIDTH; x < HALF_WIDTH; x += panelWidth) {
            if (x >= doorStart && x < doorEnd) continue; // Lewati panel ini untuk membuat pintu
            const color = wallColors[Math.abs(Math.floor(x / panelWidth)) % 2];
            const model = createModelMatrix({ translate: [x + panelWidth / 2, wallHeight - 3.5, HALF_DEPTH] });
            this.models.wallPanels.push({ model, color });
        }

        // Dinding Kiri (X = -100)
        for (let z = -HALF_DEPTH; z < HALF_DEPTH; z += panelWidth) {
            const color = wallColors[Math.abs(Math.floor(z / panelWidth)) % 2];
            const model = createModelMatrix({
                translate: [-HALF_WIDTH, wallHeight - 3.5, z + panelWidth / 2],
                rotate: [{ axis: 'y', angle: Math.PI / 2 }]
            });
            this.models.wallPanels.push({ model, color });
        }

        // Dinding Kanan (X = 100)
        for (let z = -HALF_DEPTH; z < HALF_DEPTH; z += panelWidth) {
            const color = wallColors[Math.abs(Math.floor(z / panelWidth)) % 2];
            const model = createModelMatrix({
                translate: [HALF_WIDTH, wallHeight - 3.5, z + panelWidth / 2],
                rotate: [{ axis: 'y', angle: Math.PI / 2 }]
            });
            this.models.wallPanels.push({ model, color });
        }

        this.meshes.spotlightPool = createMesh(MeshUtils.generateEllipticalCylinder, {
            params: [5, 5, 0.1, 0.1, 0.1, 64],
            deferBuffer: false
        });
        this.models.spotlightPool1 = createModelMatrix({ translate: [0, -2.7, 0] });
        this.models.spotlightPool2 = createModelMatrix({ translate: [20, -2.7, 0] });
        this.models.spotlightPool3 = createModelMatrix({ translate: [-20, -2.7, 0] });

        // --- PEMBUATAN TRIBUN DAN PENONTON ---

        // 2. GEOMETRI UNTUK TRIBUN
        // Mesh untuk platform (tangga)
        this.meshes.platform = createMesh(MeshUtils.generateBox, { params: [TRIBUNE_WIDTH, 1, 3], deferBuffer: false });
        // Mesh untuk penonton (gaya siluet)
        this.meshes.spectatorBody = createMesh(MeshUtils.generateEllipsoid, { params: [2, 5, 2, 8, 16], deferBuffer: false });
        this.meshes.spectatorHead = createMesh(MeshUtils.generateEllipsoid, { params: [1.4, 1.4, 1.4, 8, 16], deferBuffer: false });
        this.meshes.spectatorArm = createMesh(MeshUtils.generateEllipticalCylinder, { params: [0.2, 0.2, 0.3, 0.3, 3, 32, 1, true], deferBuffer: false }); // Lengan panjang kurus
        this.meshes.spectatorEye = createMesh(MeshUtils.generateEllipsoid, { params: [0.1, 0.3, 0.1, 8, 8], deferBuffer: false }); // Bola kecil untuk mata

        // --- TAMBAHAN PAGAR ---
        // Mesh untuk pagar. Lebar 100 (sesuai platform), tinggi 5, tebal 0.5
        this.meshes.fence = createMesh(MeshUtils.generateBox, { params: [TRIBUNE_WIDTH, 8, 0.5], deferBuffer: false });

        const fenceY = 0.5; // Ketinggian Y pagar
        const fenceOffset = 2.5; // Jarak pagar dari tepi platform pertama

        const posFenceFront = (HALF_DEPTH - standMarginZ) - fenceOffset;
        const posFenceBack = -(HALF_DEPTH - standMarginZ) + fenceOffset;
        const posFenceLeft = -(HALF_WIDTH - standMarginX) + fenceOffset;
        const posFenceRight = (HALF_WIDTH - standMarginX) - fenceOffset;
        
        this.models.fenceFront = createModelMatrix({ translate: [0, fenceY, posFenceFront] });
        this.models.fenceBack = createModelMatrix({ translate: [0, fenceY, posFenceBack] });
        this.models.fenceLeft = createModelMatrix({ translate: [posFenceLeft, fenceY, 0], rotate: [{ axis: 'y', angle: Math.PI / 2 }] });
        this.models.fenceRight = createModelMatrix({ translate: [posFenceRight, fenceY, 0], rotate: [{ axis: 'y', angle: Math.PI / 2 }] });

        // Array untuk menyimpan model matrix dari semua elemen tribun
        this.models.platforms = [];
        this.models.spectatorBodies = [];
        this.models.spectatorHeads = [];

        // --- PERUBAHAN: Struktur data baru untuk menyimpan info penonton ---
        this.initialSpectatorData = []; // Menyimpan posisi awal, row, dan seat
        this.models.spectators = []; // Menyimpan model matrix yang akan dianimasikan

        // 3. PENGATURAN POSISI TRIBUN
        const rows = 4;
        const seatsPerRow = 20;
        const rowHeight = 2.5; // Ketinggian tiap baris
        const rowDepth = 5.0; // Kedalaman tiap baris
        const spectatorSpacing = TRIBUNE_WIDTH / (seatsPerRow - 1);

        const clothingColors = [
            [0.8, 0.2, 0.2],  // Merah
            [0.2, 0.3, 0.8],  // Biru
            [0.1, 0.5, 0.2],  // Hijau
            [0.8, 0.8, 0.1],  // Kuning
            [0.5, 0.2, 0.8]   // Ungu
        ];

        // Helper function untuk membuat satu sisi tribun
        const createAudienceSide = (config) => {
            for (let r = 0; r < rows; r++) {
                // Hitung posisi platform untuk baris saat ini
                const platformPos = vec3.clone(config.startPos);
                vec3.scaleAndAdd(platformPos, platformPos, config.depthDir, r * rowDepth);
                vec3.scaleAndAdd(platformPos, platformPos, [0, 1, 0], r * rowHeight);

                this.models.platforms.push(createModelMatrix({
                    translate: platformPos,
                    rotate: [{ axis: 'y', angle: config.rotation }]
                }));

                // Hitung posisi awal penonton di baris ini
                const firstSeatPos = vec3.clone(platformPos);
                vec3.scaleAndAdd(firstSeatPos, firstSeatPos, config.rowDir, -(TRIBUNE_WIDTH - spectatorSpacing) / 2);
                vec3.add(firstSeatPos, firstSeatPos, [0, 5, 0]); // Naik sedikit dari platform

                for (let s = 0; s < seatsPerRow; s++) {
                    const bodyPos = vec3.clone(firstSeatPos);
                    vec3.scaleAndAdd(bodyPos, bodyPos, config.rowDir, s * spectatorSpacing);
                    // this.models.spectatorBodies.push(createModelMatrix({ translate: bodyPos }));

                    const headPos = vec3.clone(bodyPos);
                    vec3.add(headPos, headPos, [0, 5.5, 0]); // Posisi kepala di atas badan
                    // this.models.spectatorHeads.push(createModelMatrix({ translate: headPos }));

                    // Tentukan offset dan sumbu rotasi berdasarkan rotasi tribun
                    let armOffsetX, armOffsetZ, rotationAxis;
                    const armY = 4; // Ketinggian lengan dari pusat badan
                    const armDist = 1.9; // Jarak lengan dari pusat badan
                    const armDistr = -1.9; // Jarak lengan dari pusat badan

                    if (config.rotation === 0) { // Untuk tribun depan dan belakang
                        armOffsetX = armDist;
                        armOffsetZ = 0;
                        rotationAxis = 'z'; // Rotasi mengangkat lengan terjadi di sumbu Z
                    } else { // Untuk tribun kiri dan kanan
                        armOffsetX = 0;
                        armOffsetZ = armDistr;
                        rotationAxis = 'x'; // Rotasi mengangkat lengan terjadi di sumbu X
                    }

                    // Tentukan posisi awal lengan kiri dan kanan
                    const leftArmPos = vec3.clone(bodyPos);
                    vec3.add(leftArmPos, leftArmPos, [-armOffsetX, armY, -armOffsetZ]);

                    const rightArmPos = vec3.clone(bodyPos);
                    vec3.add(rightArmPos, rightArmPos, [armOffsetX, armY, armOffsetZ]);

                    // --- TAMBAHKAN BLOK KODE INI ---
                    let leftEyePos, rightEyePos;
                    const eyeYOffset = 0.2; // Sedikit di atas pusat kepala
                    const eyeForwardDist = 1.3; // Seberapa "maju" mata dari pusat kepala
                    const eyeSpacing = 0.5; // Jarak antara kedua mata

                    if (config.rotation === 0) { // Untuk tribun DEPAN dan BELAKANG (menghadap sumbu Z)
                        let actualEyeForwardDist;
                        // TAMBAHKAN PENGECEKAN INI:
                        // Jika posisi awal Z negatif, itu adalah tribun BELAKANG.
                        if (config.startPos[2] < 0) {
                            actualEyeForwardDist = 1.3; // Mata harus maju ke arah Z positif
                        } else { // Jika tidak, itu adalah tribun DEPAN.
                            actualEyeForwardDist = -1.3; // Mata harus maju ke arah Z negatif
                        }

                        // Gunakan variabel yang sudah ditentukan
                        leftEyePos = vec3.add(vec3.create(), headPos, [-eyeSpacing, eyeYOffset, actualEyeForwardDist]);
                        rightEyePos = vec3.add(vec3.create(), headPos, [eyeSpacing, eyeYOffset, actualEyeForwardDist]);
                    }
                    else { // Untuk tribun KIRI dan KANAN (menghadap sumbu X)
                        // Arah hadap tergantung sisi tribun
                        const faceDirection = config.startPos[0] > 0 ? -1 : 1; // Kanan (-X), Kiri (+X)
                        leftEyePos = vec3.add(vec3.create(), headPos, [eyeForwardDist * faceDirection, eyeYOffset, -eyeSpacing]);
                        rightEyePos = vec3.add(vec3.create(), headPos, [eyeForwardDist * faceDirection, eyeYOffset, eyeSpacing]);
                    }

                    // Simpan posisi awal DAN rotasi tribun untuk animasi
                    this.initialSpectatorData.push({
                        body: vec3.clone(bodyPos),
                        head: vec3.clone(headPos),
                        leftArm: vec3.clone(leftArmPos),
                        rightArm: vec3.clone(rightArmPos),
                        leftEye: vec3.clone(leftEyePos),     // <-- TAMBAHKAN INI
                        rightEye: vec3.clone(rightEyePos),   // <-- TAMBAHKAN INI
                        row: r,
                        seat: s,
                        rotation: config.rotation
                    });

                    // Buat model matrix untuk lengan dengan rotasi yang benar
                    const randomColor = clothingColors[Math.floor(Math.random() * clothingColors.length)];
                    const armAngle = Math.PI / 3;

                    this.models.spectators.push({
                        bodyModel: createModelMatrix({ translate: bodyPos }),
                        headModel: createModelMatrix({ translate: headPos }),
                        leftArmModel: createModelMatrix({ /* ... */ }),
                        rightArmModel: createModelMatrix({ /* ... */ }),
                        leftEyeModel: createModelMatrix({ translate: leftEyePos }),   // <-- TAMBAHKAN INI
                        rightEyeModel: createModelMatrix({ translate: rightEyePos }), // <-- TAMBAHKAN INI
                        color: randomColor
                    });
                }
            }
        };

        // Buat 4 sisi tribun
        createAudienceSide({ startPos: [0, -2, -(HALF_DEPTH - standMarginZ)], depthDir: [0, 0, -1], rowDir: [1, 0, 0], rotation: 0 }); // Belakang
        createAudienceSide({ startPos: [0, -2, (HALF_DEPTH - standMarginZ)], depthDir: [0, 0, 1], rowDir: [-1, 0, 0], rotation: 0 }); // Depan
        createAudienceSide({ startPos: [-(HALF_WIDTH - standMarginX), -2, 0], depthDir: [-1, 0, 0], rowDir: [0, 0, -1], rotation: Math.PI / 2 }); // Kiri
        createAudienceSide({ startPos: [(HALF_WIDTH - standMarginX), -2, 0], depthDir: [1, 0, 0], rowDir: [0, 0, 1], rotation: Math.PI / 2 }); // Kanan

        // 4. ALAS DASAR UNTUK SEMUANYA
        this.meshes.basePlane = createMesh(MeshUtils.generateBox, { params: [200, 0.2, 150], deferBuffer: false });
        this.models.basePlane = createModelMatrix({ translate: [0, -3.5, 0] }); // Posisikan sedikit di bawah panggung

        // Letakkan ini di akhir constructor()

        // =======================================================================
        // --- MULAI PERUBAHAN ATAP ---
        // =======================================================================
        
        // 8. ATAP SIRKUS (PIRAMIDA BERGARIS)
        const wallTopY = 55;        
        const roofPeakY = 85;       // Ketinggian puncak atap
        const roofPanelWidth = 5;   // Lebar panel, samakan dengan dinding
        
        this.models.roofPanels = []; // Array baru untuk menyimpan panel atap

        // Helper function untuk membuat satu panel segitiga atap
        const createRoofPanel = (p1, p2, p3, color) => {
            // Urutan vertex (p1, p2, p3) menentukan arah hadap (normal)
            const positions = new Float32Array([...p1, ...p2, ...p3]);
            const indices = new Uint16Array([0, 1, 2]); // Satu segitiga
            const normals = MeshUtils.computeNormals(positions, indices);
            const buffers = MeshUtils.createMeshBuffers(GL, { positions, indices, normals }, attribs);
            
            this.models.roofPanels.push({
                buffers: buffers,
                model: mat4.create(), // Posisi sudah di world space, model tidak perlu diubah
                color: color
            });
        };

        const roofPeak = [0, roofPeakY, 0]; // Titik puncak atap

        // Loop untuk Sisi Belakang (Z = -HALF_DEPTH)
        for (let x = -HALF_WIDTH; x < HALF_WIDTH; x += roofPanelWidth) {
            const p1 = [x, wallTopY, -HALF_DEPTH];
            const p2 = [x + roofPanelWidth, wallTopY, -HALF_DEPTH];
            const color = wallColors[Math.abs(Math.floor(x / roofPanelWidth)) % 2];
            createRoofPanel(p1, p2, roofPeak, color); // Winding: p1, p2, peak
        }

        // Loop untuk Sisi Depan (Z = +HALF_DEPTH)
        for (let x = -HALF_WIDTH; x < HALF_WIDTH; x += roofPanelWidth) {
            const p1 = [x, wallTopY, HALF_DEPTH];
            const p2 = [x + roofPanelWidth, wallTopY, HALF_DEPTH];
            const color = wallColors[Math.abs(Math.floor(x / roofPanelWidth)) % 2];
            createRoofPanel(p2, p1, roofPeak, color); // Winding: p2, p1, peak (dibalik agar normal ke luar)
        }

        // Loop untuk Sisi Kiri (X = -HALF_WIDTH)
        for (let z = -HALF_DEPTH; z < HALF_DEPTH; z += roofPanelWidth) {
            const p1 = [-HALF_WIDTH, wallTopY, z];
            const p2 = [-HALF_WIDTH, wallTopY, z + roofPanelWidth];
            const color = wallColors[Math.abs(Math.floor(z / roofPanelWidth)) % 2];
            createRoofPanel(p2, p1, roofPeak, color); // Winding: p2, p1, peak (dibalik agar normal ke luar)
        }

        // Loop untuk Sisi Kanan (X = +HALF_WIDTH)
        for (let z = -HALF_DEPTH; z < HALF_DEPTH; z += roofPanelWidth) {
            const p1 = [HALF_WIDTH, wallTopY, z];
            const p2 = [HALF_WIDTH, wallTopY, z + roofPanelWidth];
            const color = wallColors[Math.abs(Math.floor(z / roofPanelWidth)) % 2];
            createRoofPanel(p1, p2, roofPeak, color); // Winding: p1, p2, peak
        }
        
        // --- 9. TAMBAHAN: RANGKA ATAP (FOUNDATIONS) ---
        const beamRadius = 1.0; // Seberapa tebal "rangka besi"
        // Buat satu mesh silinder standar (tinggi 1, radius 1)
        this.meshes.roofBeam = createMesh(MeshUtils.generateEllipticalCylinder, { 
            params: [beamRadius, beamRadius, beamRadius, beamRadius, 1.0, 16], 
            deferBuffer: false 
        });
        
        this.models.roofBeams = []; // Array untuk menyimpan 4 model matrix balok
        
        const v_up = [0, 1, 0]; // Vektor "atas" standar silinder
        const peakVec = [0, roofPeakY, 0];
        
        const corners = [
            [-HALF_WIDTH, wallTopY, -HALF_DEPTH], // Kiri-Belakang
            [ HALF_WIDTH, wallTopY, -HALF_DEPTH], // Kanan-Belakang
            [ HALF_WIDTH, wallTopY,  HALF_DEPTH], // Kanan-Depan
            [-HALF_WIDTH, wallTopY,  HALF_DEPTH]  // Kiri-Depan
        ];

        // Buat 4 balok untuk setiap sudut
        for (const startVec of corners) {
            const beamVec = vec3.subtract(vec3.create(), peakVec, startVec);
            const length = vec3.length(beamVec);
            const dir = vec3.normalize(vec3.create(), beamVec);
            const center = vec3.lerp(vec3.create(), startVec, peakVec, 0.5);

            // Hitung rotasi untuk mengarahkan silinder (v_up) ke 'dir'
            let rotationAxis = vec3.cross(vec3.create(), v_up, dir);
            vec3.normalize(rotationAxis, rotationAxis);
            let rotationAngle = Math.acos(vec3.dot(v_up, dir));

            // Cek kasus khusus jika cross product 0 (vektor sejajar)
            if (vec3.length(rotationAxis) < 0.001) {
                rotationAxis = [1, 0, 0]; // Sumbu rotasi default jika sejajar
                rotationAngle = (vec3.dot(v_up, dir) > 0) ? 0 : Math.PI; // 0 atau 180 derajat
            }
            
            const model = createModelMatrix({ 
                translate: center, 
                rotate: [{ axis: rotationAxis, angle: rotationAngle }], 
                scale: [1, length, 1] // Skalakan silinder (tinggi 1) ke panjang yang benar
            });
            
            this.models.roofBeams.push(model);
        }

        // =======================================================================
        // --- SELESAI PERUBAHAN ATAP ---
        // =======================================================================
    }

    animate(time) {
        // Pengaturan gerakan
        const speed = 0.010;
        const height = 0.3; // Seberapa tinggi penonton bergerak

        // Gelombang sinus dasar untuk animasi
        const baseWave = time * speed;

        // Loop melalui setiap penonton untuk memperbarui posisinya
        this.initialSpectatorData.forEach((initialData, i) => {
            // Tentukan apakah penonton ini "genap" atau "ganjil" berdasarkan posisi gridnya
            const isEvenPattern = (initialData.row + initialData.seat) % 2 === 0;

            // Buat fase yang berlawanan untuk kelompok ganjil
            const phaseShift = isEvenPattern ? 0 : Math.PI;

            // Hitung nilai gelombang (0 -> 1 -> 0)
            const wave = (Math.sin(baseWave + phaseShift) + 1) / 2;
            const yOffset = wave * height;

            // Posisi baru untuk badan dan kepala (sudah ada)
            const newBodyPos = vec3.clone(initialData.body);
            newBodyPos[1] += yOffset;
            const newHeadPos = vec3.clone(initialData.head);
            newHeadPos[1] += yOffset;

            // TAMBAHKAN: Hitung posisi baru untuk lengan
            const newLeftArmPos = vec3.clone(initialData.leftArm);
            newLeftArmPos[1] += yOffset;
            const newRightArmPos = vec3.clone(initialData.rightArm);
            newRightArmPos[1] += yOffset;

            // --- TAMBAHKAN KODE INI ---
            const newLeftEyePos = vec3.clone(initialData.leftEye);
            newLeftEyePos[1] += yOffset;
            const newRightEyePos = vec3.clone(initialData.rightEye);
            newRightEyePos[1] += yOffset;
            // --- AKHIR KODE TAMBAHAN ---


            const rotationAxis = initialData.rotation === 0 ? 'z' : 'x';
            const armAngle = Math.PI / 10.5;

            // --- PERBARUI OBJEK DI BAWAH INI ---
            this.models.spectators[i] = {
                bodyModel: createModelMatrix({ translate: newBodyPos }),
                headModel: createModelMatrix({ translate: newHeadPos }),
                leftArmModel: createModelMatrix({
                    translate: newLeftArmPos,
                    rotate: [{ axis: rotationAxis, angle: armAngle }]
                }),
                rightArmModel: createModelMatrix({
                    translate: newRightArmPos,
                    rotate: [{ axis: rotationAxis, angle: -armAngle }]
                }),
                leftEyeModel: createModelMatrix({ translate: newLeftEyePos }),     // <-- TAMBAHKAN INI
                rightEyeModel: createModelMatrix({ translate: newRightEyePos }),   // <-- TAMBAHKAN INI
                color: this.models.spectators[i].color
            };
        });

    }

    drawObject() {

        // GAMBAR LAPANGAN HIJAU DI LUAR
        drawObject(this.meshes.grassField.solid.buffers, this.models.grassField, [0.3, 0.6, 0.2], GL.TRIANGLES); // Warna hijau rumput

        // GAMBAR ALAS DASAR
        drawObject(this.meshes.basePlane.solid.buffers, this.models.basePlane, [0.878, 0.686, 0.624], GL.TRIANGLES);


        // GAMBAR DINDING LANGIT
        const skyColor = [0.114, 0.569, 0.831]; // Warna biru langit
        drawObject(this.meshes.skyWall.solid.buffers, this.models.skyWallBack, skyColor, GL.TRIANGLES);
        drawObject(this.meshes.skyWall.solid.buffers, this.models.skyWallFront, skyColor, GL.TRIANGLES);
        drawObject(this.meshes.skyWall.solid.buffers, this.models.skyWallLeft, skyColor, GL.TRIANGLES);
        drawObject(this.meshes.skyWall.solid.buffers, this.models.skyWallRight, skyColor, GL.TRIANGLES);
        
        // --- TAMBAHAN ATAP LANGIT ---
        drawObject(this.meshes.skyRoof.solid.buffers, this.models.skyRoof, skyColor, GL.TRIANGLES);
        // --- AKHIR TAMBAHAN ---

        // GAMBAR LAPANGAN HIJAU DI LUAR
        drawObject(this.meshes.grassField.solid.buffers, this.models.grassField, [0.3, 0.6, 0.2], GL.TRIANGLES);



        drawObject(this.meshes.fence.solid.buffers, this.models.fenceFront, [0, 0, 0], GL.TRIANGLES);
        drawObject(this.meshes.fence.solid.buffers, this.models.fenceBack, [0, 0, 0], GL.TRIANGLES);
        // Menggunakan mesh 'fence' untuk kiri & kanan (yang sudah dirotasi)
        drawObject(this.meshes.fence.solid.buffers, this.models.fenceLeft, [0, 0, 0], GL.TRIANGLES);
        drawObject(this.meshes.fence.solid.buffers, this.models.fenceRight, [0, 0, 0], GL.TRIANGLES);



        // GAMBAR ALAS DASAR
        drawObject(this.meshes.basePlane.solid.buffers, this.models.basePlane, [0.878, 0.686, 0.624], GL.TRIANGLES); // Warna krem muda     

        // Gambar elemen panggung utama
        drawObject(this.meshes.stageFloor.solid.buffers, this.models.stageFloor, [0.2, 0.2, 0.25], GL.TRIANGLES);

        for (const plankModel of this.models.planks) {
            drawObject(this.meshes.woodPlank.solid.buffers, plankModel, [0.4, 0.25, 0.15], GL.TRIANGLES);
        }

        drawObject(this.meshes.spotlightPool.solid.buffers, this.models.spotlightPool1, [0.8, 0.8, 0.6], GL.TRIANGLES);
        drawObject(this.meshes.spotlightPool.solid.buffers, this.models.spotlightPool2, [0.8, 0.8, 0.6], GL.TRIANGLES);
        drawObject(this.meshes.spotlightPool.solid.buffers, this.models.spotlightPool3, [0.8, 0.8, 0.6], GL.TRIANGLES);

        // --- MENGGAMBAR TRIBUN DAN PENONTON ---

        // Gambar semua platform
        for (const platformModel of this.models.platforms) {
            drawObject(this.meshes.platform.solid.buffers, platformModel, [0.3, 0.3, 0.35], GL.TRIANGLES);
        }

        const skinTone = [0.85, 0.7, 0.62]; // Krem kulit

        this.models.spectators.forEach((spectator) => {
            const bodyColor = spectator.color;

            // Gambar badan dan kepala (sudah ada)
            drawObject(this.meshes.spectatorBody.solid.buffers, spectator.bodyModel, bodyColor, GL.TRIANGLES);
            drawObject(this.meshes.spectatorHead.solid.buffers, spectator.headModel, skinTone, GL.TRIANGLES);

            //  Gambar lengan kiri dan kanan
            drawObject(this.meshes.spectatorArm.solid.buffers, spectator.leftArmModel, skinTone, GL.TRIANGLES);
            drawObject(this.meshes.spectatorArm.solid.buffers, spectator.rightArmModel, skinTone, GL.TRIANGLES);

            const eyeColor = [0.1, 0.1, 0.1]; // Warna hitam untuk mata
            drawObject(this.meshes.spectatorEye.solid.buffers, spectator.leftEyeModel, eyeColor, GL.TRIANGLES);
            drawObject(this.meshes.spectatorEye.solid.buffers, spectator.rightEyeModel, eyeColor, GL.TRIANGLES);
        });
        
        // --- MENGGAMBAR DINDING SIRKUS ---
        for (const panel of this.models.wallPanels) {
            drawObject(this.meshes.wallPanel.solid.buffers, panel.model, panel.color, GL.TRIANGLES);
        }

        
        // --- MENGGAMBAR ATAP SIRKUS ---
        // Gambar panel-panel atap yang bergaris
        for (const panel of this.models.roofPanels) {
            drawObject(panel.buffers, panel.model, panel.color, GL.TRIANGLES);
        }
        
        // --- GAMBAR RANGKA ATAP ---
        // Gambar 4 balok rangka di atas panel atap
        const ironColor = [0.2, 0.2, 0.25]; // Warna abu-abu gelap
        for (const beamModel of this.models.roofBeams) {
            drawObject(this.meshes.roofBeam.solid.buffers, beamModel, ironColor, GL.TRIANGLES);
        }
    }
}