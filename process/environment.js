import { BaseCharacter } from '/process/BaseCharacter.js';
import { createModelMatrix, createMesh, drawObject, applyTransformToMesh, recenterMesh } from '../CreateObject.js';
import { MeshUtilsCurves } from '../MeshUtilsCurves.js';
import { MeshUtils } from '../MeshUtils.js';
import * as Curves from '../curves.js';
import { makeModel } from "../bone.js";
import { GL, attribs } from '../main.js'

export class env extends BaseCharacter {
    constructor() {
        super();
        this.meshes = {};
        this.models = {};

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

        // Ganti baris ini:
        this.meshes.basePlane = createMesh(MeshUtils.generateBox, { params: [200, 0.2, 200], deferBuffer: false });

        // Dengan yang ini:
        this.meshes.basePlane = createMesh(MeshUtils.generateBox, { params: [200, 0.2, 150], deferBuffer: false });

        // ... (setelah this.models.basePlane = ...)

        // 5. DINDING SIRKUS
        this.meshes.wallPanel = createMesh(MeshUtils.generateBox, { params: [5, 70, 1], deferBuffer: false }); // Lebar panel 5, tinggi 25
        this.models.wallPanels = [];

        const wallHeight = 12.5; // Setengah dari tinggi panel, untuk penempatan Y
        const wallColors = [
            [0.8, 0.15, 0.15], // Merah
            [0.9, 0.9, 0.85]   // Putih Gading
        ];
        const panelWidth = 5;
        const doorStart = 80; // Posisi X di mana pintu dimulai
        const doorEnd = 95;   // Posisi X di mana pintu berakhir

        // Dinding Belakang (Z = -75)
        for (let x = -100; x < 100; x += panelWidth) {
            const color = wallColors[(x / panelWidth) % 2 === 0 ? 0 : 1];
            const model = createModelMatrix({ translate: [x + panelWidth / 2, wallHeight - 3.5, -75] });
            this.models.wallPanels.push({ model, color });
        }

        // Dinding Depan (Z = 75) - dengan celah pintu
        for (let x = -100; x < 100; x += panelWidth) {
            if (x >= doorStart && x < doorEnd) continue; // Lewati panel ini untuk membuat pintu
            const color = wallColors[(x / panelWidth) % 2 === 0 ? 0 : 1];
            const model = createModelMatrix({ translate: [x + panelWidth / 2, wallHeight - 3.5, 75] });
            this.models.wallPanels.push({ model, color });
        }

        // Dinding Kiri (X = -100)
        for (let z = -75; z < 75; z += panelWidth) {
            const color = wallColors[(z / panelWidth) % 2 === 0 ? 0 : 1];
            const model = createModelMatrix({
                translate: [-100, wallHeight - 3.5, z + panelWidth / 2],
                rotate: [{ axis: 'y', angle: Math.PI / 2 }]
            });
            this.models.wallPanels.push({ model, color });
        }

        // Dinding Kanan (X = 100)
        for (let z = -75; z < 75; z += panelWidth) {
            const color = wallColors[(z / panelWidth) % 2 === 0 ? 0 : 1];
            const model = createModelMatrix({
                translate: [100, wallHeight - 3.5, z + panelWidth / 2],
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
        this.meshes.platform = createMesh(MeshUtils.generateBox, { params: [100, 1, 3], deferBuffer: false });
        // Mesh untuk penonton (gaya siluet)
        this.meshes.spectatorBody = createMesh(MeshUtils.generateEllipsoid, { params: [2, 5, 2, 8, 16], deferBuffer: false });
        this.meshes.spectatorHead = createMesh(MeshUtils.generateEllipsoid, { params: [1.4, 1.4, 1.4, 8, 16], deferBuffer: false });

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
        const spectatorSpacing = 5; // Jarak antar penonton


        // =============================

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
                vec3.scaleAndAdd(firstSeatPos, firstSeatPos, config.rowDir, -(seatsPerRow - 1) * spectatorSpacing / 2);
                vec3.add(firstSeatPos, firstSeatPos, [0, 5, 0]); // Naik sedikit dari platform

                for (let s = 0; s < seatsPerRow; s++) {
                    const bodyPos = vec3.clone(firstSeatPos);
                    vec3.scaleAndAdd(bodyPos, bodyPos, config.rowDir, s * spectatorSpacing);
                    this.models.spectatorBodies.push(createModelMatrix({ translate: bodyPos }));

                    const headPos = vec3.clone(bodyPos);
                    vec3.add(headPos, headPos, [0, 5.5, 0]); // Posisi kepala di atas badan
                    this.models.spectatorHeads.push(createModelMatrix({ translate: headPos }));

                    // --- PERBAIKAN DI SINI ---
                    // Clone the vectors to store a snapshot of their values, not a reference.
                    this.initialSpectatorData.push({
                        body: vec3.clone(bodyPos), // Clone the body position
                        head: vec3.clone(headPos), // Clone the head position
                        row: r,
                        seat: s
                    });

                    // Buat model matrix awal yang akan diubah di 'animate'
                    this.models.spectators.push({
                        bodyModel: createModelMatrix({ translate: bodyPos }),
                        headModel: createModelMatrix({ translate: headPos })
                    });
                }
            }
        };

        // Buat 4 sisi tribun
        createAudienceSide({ startPos: [0, -2, -35], depthDir: [0, 0, -1], rowDir: [1, 0, 0], rotation: 0 }); // Belakang
        createAudienceSide({ startPos: [0, -2, 35], depthDir: [0, 0, 1], rowDir: [-1, 0, 0], rotation: 0 }); // Depan
        createAudienceSide({ startPos: [-70, -2, 0], depthDir: [-1, 0, 0], rowDir: [0, 0, -1], rotation: Math.PI / 2 }); // Kiri
        createAudienceSide({ startPos: [70, -2, 0], depthDir: [1, 0, 0], rowDir: [0, 0, 1], rotation: Math.PI / 2 }); // Kanan


        // 4. ALAS DASAR UNTUK SEMUANYA
        this.meshes.basePlane = createMesh(MeshUtils.generateBox, { params: [200, 0.2, 150], deferBuffer: false });
        this.models.basePlane = createModelMatrix({ translate: [0, -3.5, 0] }); // Posisikan sedikit di bawah panggung
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

            // Hitung posisi baru dengan menambahkan offset Y
            const newBodyPos = vec3.clone(initialData.body);
            newBodyPos[1] += yOffset;

            const newHeadPos = vec3.clone(initialData.head);
            newHeadPos[1] += yOffset;

            // Buat ulang model matrix dengan posisi baru
            this.models.spectators[i].bodyModel = createModelMatrix({ translate: newBodyPos });
            this.models.spectators[i].headModel = createModelMatrix({ translate: newHeadPos });
        });

    }

    drawObject() {
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

        // === PERBAIKAN DI SINI ===
        // Loop melalui 'this.models.spectators' yang sudah dianimasikan
        const clothingColors = [
            [0.8, 0.2, 0.2],  // Merah
            [0.2, 0.3, 0.8],  // Biru
            [0.1, 0.5, 0.2],  // Hijau
            [0.8, 0.8, 0.1],  // Kuning
            [0.5, 0.2, 0.8]   // Ungu
        ];
        // Warna kulit untuk semua kepala
        const skinTone = [0.85, 0.7, 0.62]; // Krem kulit

        this.models.spectators.forEach((spectator, i) => {
            const bodyColor = clothingColors[i % clothingColors.length];

            // Ambil model matrix dari objek 'spectator'
            drawObject(this.meshes.spectatorBody.solid.buffers, spectator.bodyModel, bodyColor, GL.TRIANGLES); // Gunakan bodyColor
            drawObject(this.meshes.spectatorHead.solid.buffers, spectator.headModel, skinTone, GL.TRIANGLES);   // Gunakan skinTone
        });

        // ... (setelah kode menggambar penonton)

        // --- MENGGAMBAR DINDING SIRKUS ---
        for (const panel of this.models.wallPanels) {
            drawObject(this.meshes.wallPanel.solid.buffers, panel.model, panel.color, GL.TRIANGLES);
        }
    }
}


