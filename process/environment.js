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

        const CIRCUS_WIDTH = 300; 
        const CIRCUS_DEPTH = 200; 

        const HALF_WIDTH = CIRCUS_WIDTH / 2;
        const HALF_DEPTH = CIRCUS_DEPTH / 2;

        // Dimensi Tribun untuk sisi Panjang (X) dan Pendek (Z)
        const TRIBUNE_DIM_X = CIRCUS_WIDTH * 0.8; // 240
        const TRIBUNE_DIM_Z = CIRCUS_DEPTH * 0.8; // 160

        const standMarginX = (CIRCUS_WIDTH - TRIBUNE_DIM_X) / 2;
        const standMarginZ = (CIRCUS_DEPTH - TRIBUNE_DIM_Z) / 2;

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

        // 7. DINDING LANGIT
        this.meshes.skyWall = createMesh(MeshUtils.generateBox, { params: [500, 200, 1], deferBuffer: false });
        const skyWallY = 100 - 3.7; 
        this.models.skyWallBack = createModelMatrix({ translate: [0, skyWallY, -250] });
        this.models.skyWallFront = createModelMatrix({ translate: [0, skyWallY, 250] });
        this.models.skyWallLeft = createModelMatrix({ translate: [-250, skyWallY, 0], rotate: [{ axis: 'y', angle: Math.PI / 2 }] });
        this.models.skyWallRight = createModelMatrix({ translate: [250, skyWallY, 0], rotate: [{ axis: 'y', angle: Math.PI / 2 }] });
        
        // --- ATAP LANGIT ---
        this.meshes.skyRoof = createMesh(MeshUtils.generateBox, { params: [500, 1, 500], deferBuffer: false });
        const skyRoofY = skyWallY + 100; 
        this.models.skyRoof = createModelMatrix({ translate: [0, skyRoofY, 0] });

        // 6. LAPANGAN HIJAU
        this.meshes.grassField = createMesh(MeshUtils.generateBox, { params: [500, 0.2, 500], deferBuffer: false });
        this.models.grassField = createModelMatrix({ translate: [0, -3.7, 0] }); 

        this.meshes.basePlane = createMesh(MeshUtils.generateBox, { params: [CIRCUS_WIDTH, 0.2, CIRCUS_DEPTH], deferBuffer: false });

        // 5. DINDING SIRKUS
        this.meshes.wallPanel = createMesh(MeshUtils.generateBox, { params: [5, 60, 1], deferBuffer: false });
        this.models.wallPanels = [];

        const wallHeight = 28.5; 
        const wallColors = [[0.8, 0.15, 0.15], [0.9, 0.9, 0.85]];
        const panelWidth = 5;
        // const doorStart = HALF_WIDTH - 40; // Dihapus agar dinding tertutup
        // const doorEnd = HALF_WIDTH - 25;   // Dihapus agar dinding tertutup

        // Dinding Belakang 
        for (let x = -HALF_WIDTH; x < HALF_WIDTH; x += panelWidth) {
            const color = wallColors[Math.abs(Math.floor(x / panelWidth)) % 2];
            this.models.wallPanels.push({ model: createModelMatrix({ translate: [x + panelWidth / 2, wallHeight - 3.5, -HALF_DEPTH] }), color });
        }
        // Dinding Depan (Full tertutup)
        for (let x = -HALF_WIDTH; x < HALF_WIDTH; x += panelWidth) {
            const color = wallColors[Math.abs(Math.floor(x / panelWidth)) % 2];
            this.models.wallPanels.push({ model: createModelMatrix({ translate: [x + panelWidth / 2, wallHeight - 3.5, HALF_DEPTH] }), color });
        }
        // Dinding Kiri
        for (let z = -HALF_DEPTH; z < HALF_DEPTH; z += panelWidth) {
            const color = wallColors[Math.abs(Math.floor(z / panelWidth)) % 2];
            this.models.wallPanels.push({ model: createModelMatrix({ translate: [-HALF_WIDTH, wallHeight - 3.5, z + panelWidth / 2], rotate: [{ axis: 'y', angle: Math.PI / 2 }] }), color });
        }
        // Dinding Kanan
        for (let z = -HALF_DEPTH; z < HALF_DEPTH; z += panelWidth) {
            const color = wallColors[Math.abs(Math.floor(z / panelWidth)) % 2];
            this.models.wallPanels.push({ model: createModelMatrix({ translate: [HALF_WIDTH, wallHeight - 3.5, z + panelWidth / 2], rotate: [{ axis: 'y', angle: Math.PI / 2 }] }), color });
        }

        this.meshes.spotlightPool = createMesh(MeshUtils.generateEllipticalCylinder, { params: [5, 5, 0.1, 0.1, 0.1, 64], deferBuffer: false });
        this.models.spotlightPool1 = createModelMatrix({ translate: [0, -2.7, 0] });
        this.models.spotlightPool2 = createModelMatrix({ translate: [20, -2.7, 0] });
        this.models.spotlightPool3 = createModelMatrix({ translate: [-20, -2.7, 0] });

        // --- TRIBUN (DIPISAH UKURANNYA) ---
        // Platform Panjang (Depan/Belakang)
        this.meshes.platformLong = createMesh(MeshUtils.generateBox, { params: [TRIBUNE_DIM_X, 1, 3], deferBuffer: false });
        // Platform Pendek (Kiri/Kanan)
        this.meshes.platformShort = createMesh(MeshUtils.generateBox, { params: [TRIBUNE_DIM_Z, 1, 3], deferBuffer: false });

        // === 10. FONDASI TRIBUN (TABUNG KE BAWAH) ===
        // Cylinder radius 0.8, tinggi dasar 1.0 (nanti discale)
        this.meshes.foundation = createMesh(MeshUtils.generateEllipticalCylinder, { 
            params: [0.8, 0.8, 0.8, 0.8, 1.0, 16], 
            deferBuffer: false 
        });
        this.models.foundations = [];

        this.meshes.spectatorBody = createMesh(MeshUtils.generateEllipsoid, { params: [2, 5, 2, 8, 16], deferBuffer: false });
        this.meshes.spectatorHead = createMesh(MeshUtils.generateEllipsoid, { params: [1.4, 1.4, 1.4, 8, 16], deferBuffer: false });
        this.meshes.spectatorArm = createMesh(MeshUtils.generateEllipticalCylinder, { params: [0.2, 0.2, 0.3, 0.3, 3, 32, 1, true], deferBuffer: false });
        this.meshes.spectatorEye = createMesh(MeshUtils.generateEllipsoid, { params: [0.1, 0.3, 0.1, 8, 8], deferBuffer: false });

        // Pagar (Fence) juga dipisah ukurannya
        this.meshes.fenceLong = createMesh(MeshUtils.generateBox, { params: [TRIBUNE_DIM_X, 8, 0.5], deferBuffer: false });
        this.meshes.fenceShort = createMesh(MeshUtils.generateBox, { params: [TRIBUNE_DIM_Z, 8, 0.5], deferBuffer: false });

        const fenceY = 0.5; 
        const fenceOffset = 2.5; 
        const posFenceFront = (HALF_DEPTH - standMarginZ) - fenceOffset;
        const posFenceBack = -(HALF_DEPTH - standMarginZ) + fenceOffset;
        const posFenceLeft = -(HALF_WIDTH - standMarginX) + fenceOffset;
        const posFenceRight = (HALF_WIDTH - standMarginX) - fenceOffset;
        
        this.models.fenceFront = createModelMatrix({ translate: [0, fenceY, posFenceFront] });
        this.models.fenceBack = createModelMatrix({ translate: [0, fenceY, posFenceBack] });
        this.models.fenceLeft = createModelMatrix({ translate: [posFenceLeft, fenceY, 0], rotate: [{ axis: 'y', angle: Math.PI / 2 }] });
        this.models.fenceRight = createModelMatrix({ translate: [posFenceRight, fenceY, 0], rotate: [{ axis: 'y', angle: Math.PI / 2 }] });

        this.models.platformsLong = [];
        this.models.platformsShort = [];
        this.models.spectatorBodies = [];
        this.models.spectatorHeads = [];
        this.initialSpectatorData = []; 
        this.models.spectators = []; 

        const rows = 4;
        const rowHeight = 2.5;
        const rowDepth = 5.0;
        const clothingColors = [[0.8, 0.2, 0.2], [0.2, 0.3, 0.8], [0.1, 0.5, 0.2], [0.8, 0.8, 0.1], [0.5, 0.2, 0.8]];

        // Fungsi Pembantu Generik
        const createAudienceSide = (config) => {
            // Tentukan lebar area duduk agar ada jarak (padding) dari pojok
            // Padding total 40 (20 kiri, 20 kanan)
            const seatingWidth = config.totalWidth - 40; 
            const spectatorSpacing = seatingWidth / (config.seatsCount - 1);
            
            // Level tanah untuk dasar fondasi
            const groundY = -3.5; 

            for (let r = 0; r < rows; r++) {
                // Posisi Platform
                const platformPos = vec3.clone(config.startPos);
                vec3.scaleAndAdd(platformPos, platformPos, config.depthDir, r * rowDepth);
                vec3.scaleAndAdd(platformPos, platformPos, [0, 1, 0], r * rowHeight);
                
                // Simpan model matrix ke array yang sesuai (Long/Short)
                if (config.type === 'long') {
                    this.models.platformsLong.push(createModelMatrix({ translate: platformPos, rotate: [{ axis: 'y', angle: config.rotation }] }));
                } else {
                    this.models.platformsShort.push(createModelMatrix({ translate: platformPos, rotate: [{ axis: 'y', angle: config.rotation }] }));
                }

                // === GENERATE FONDASI TABUNG KE BAWAH ===
                // Kita beri fondasi setiap ~25 unit
                const foundationSpacing = 25;
                const numFoundations = Math.floor(config.totalWidth / foundationSpacing);
                // Pastikan minimal ada di ujung kiri dan kanan
                const foundationCount = Math.max(2, numFoundations);
                
                const currentPlatformY = platformPos[1];
                const foundationHeight = currentPlatformY - groundY;

                // Hanya buat jika tingginya cukup signifikan
                if (foundationHeight > 0.5) {
                    for (let k = 0; k <= foundationCount; k++) {
                        const t = k / foundationCount; // 0.0 s/d 1.0
                        // Offset dari tengah (-width/2 s/d +width/2) dengan sedikit margin
                        const offset = -(config.totalWidth / 2) + 2 + t * (config.totalWidth - 4);
                        
                        const fPos = vec3.clone(platformPos);
                        vec3.scaleAndAdd(fPos, fPos, config.rowDir, offset);
                        
                        // Posisi Y fondasi harus di tengah-tengah antara tanah dan platform
                        fPos[1] = groundY + foundationHeight / 2;

                        this.models.foundations.push(createModelMatrix({
                            translate: fPos,
                            scale: [1, foundationHeight, 1] // Scale Y agar pas dari tanah ke platform
                        }));
                    }
                }

                // Posisi Kursi Pertama (Centered)
                const firstSeatPos = vec3.clone(platformPos);
                // Mundur setengah dari lebar area duduk agar posisi (0,0) platform menjadi tengah barisan
                vec3.scaleAndAdd(firstSeatPos, firstSeatPos, config.rowDir, -seatingWidth / 2);
                vec3.add(firstSeatPos, firstSeatPos, [0, 5, 0]);

                for (let s = 0; s < config.seatsCount; s++) {
                    const bodyPos = vec3.clone(firstSeatPos);
                    vec3.scaleAndAdd(bodyPos, bodyPos, config.rowDir, s * spectatorSpacing);
                    
                    const headPos = vec3.clone(bodyPos); vec3.add(headPos, headPos, [0, 5.5, 0]);
                    let armOffsetX, armOffsetZ, rotationAxis;
                    const armY = 4; const armDist = 1.9; const armDistr = -1.9;
                    
                    if (config.rotation === 0) { armOffsetX = armDist; armOffsetZ = 0; rotationAxis = 'z'; } 
                    else { armOffsetX = 0; armOffsetZ = armDistr; rotationAxis = 'x'; }
                    
                    const leftArmPos = vec3.clone(bodyPos); vec3.add(leftArmPos, leftArmPos, [-armOffsetX, armY, -armOffsetZ]);
                    const rightArmPos = vec3.clone(bodyPos); vec3.add(rightArmPos, rightArmPos, [armOffsetX, armY, armOffsetZ]);
                    
                    let leftEyePos, rightEyePos; const eyeYOffset = 0.2; const eyeForwardDist = 1.3; const eyeSpacing = 0.5;
                    if (config.rotation === 0) { 
                        let actualEyeForwardDist = (config.startPos[2] < 0) ? 1.3 : -1.3;
                        leftEyePos = vec3.add(vec3.create(), headPos, [-eyeSpacing, eyeYOffset, actualEyeForwardDist]);
                        rightEyePos = vec3.add(vec3.create(), headPos, [eyeSpacing, eyeYOffset, actualEyeForwardDist]);
                    } else { 
                        const faceDirection = config.startPos[0] > 0 ? -1 : 1; 
                        leftEyePos = vec3.add(vec3.create(), headPos, [eyeForwardDist * faceDirection, eyeYOffset, -eyeSpacing]);
                        rightEyePos = vec3.add(vec3.create(), headPos, [eyeForwardDist * faceDirection, eyeYOffset, eyeSpacing]);
                    }
                    
                    this.initialSpectatorData.push({ body: vec3.clone(bodyPos), head: vec3.clone(headPos), leftArm: vec3.clone(leftArmPos), rightArm: vec3.clone(rightArmPos), leftEye: vec3.clone(leftEyePos), rightEye: vec3.clone(rightEyePos), row: r, seat: s, rotation: config.rotation });
                    const randomColor = clothingColors[Math.floor(Math.random() * clothingColors.length)];
                    this.models.spectators.push({ bodyModel: createModelMatrix({ translate: bodyPos }), headModel: createModelMatrix({ translate: headPos }), leftArmModel: createModelMatrix({}), rightArmModel: createModelMatrix({}), leftEyeModel: createModelMatrix({ translate: leftEyePos }), rightEyeModel: createModelMatrix({ translate: rightEyePos }), color: randomColor });
                }
            }
        };

        // --- Buat 4 Sisi Tribun dengan Parameter Berbeda ---
        
        // 1. Belakang (Sisi Panjang) - 20 Kursi
        createAudienceSide({ 
            type: 'long',
            totalWidth: TRIBUNE_DIM_X,
            seatsCount: 20,
            startPos: [0, -2, -(HALF_DEPTH - standMarginZ)], 
            depthDir: [0, 0, -1], 
            rowDir: [1, 0, 0], 
            rotation: 0 
        }); 
        
        // 2. Depan (Sisi Panjang) - 20 Kursi
        createAudienceSide({ 
            type: 'long',
            totalWidth: TRIBUNE_DIM_X,
            seatsCount: 20,
            startPos: [0, -2, (HALF_DEPTH - standMarginZ)], 
            depthDir: [0, 0, 1], 
            rowDir: [-1, 0, 0], 
            rotation: 0 
        }); 
        
        // 3. Kiri (Sisi Pendek) - 12 Kursi (dikurangi biar ga nabrak)
        createAudienceSide({ 
            type: 'short',
            totalWidth: TRIBUNE_DIM_Z,
            seatsCount: 12,
            startPos: [-(HALF_WIDTH - standMarginX), -2, 0], 
            depthDir: [-1, 0, 0], 
            rowDir: [0, 0, -1], 
            rotation: Math.PI / 2 
        }); 
        
        // 4. Kanan (Sisi Pendek) - 12 Kursi
        createAudienceSide({ 
            type: 'short',
            totalWidth: TRIBUNE_DIM_Z,
            seatsCount: 12,
            startPos: [(HALF_WIDTH - standMarginX), -2, 0], 
            depthDir: [1, 0, 0], 
            rowDir: [0, 0, 1], 
            rotation: Math.PI / 2 
        }); 

        this.models.basePlane = createModelMatrix({ translate: [0, -3.5, 0] }); 

        // =======================================================================
        // --- 8. ATAP SIRKUS ---
        // =======================================================================
        
        const wallTopY = 55;        
        const roofPeakY = 85;       
        const roofPanelWidth = 5;   
        this.models.roofPanels = []; 

        const createRoofPanel = (p1, p2, p3, color) => {
            const positions = new Float32Array([...p1, ...p2, ...p3]);
            const indices = new Uint16Array([0, 1, 2]); 
            const normals = MeshUtils.computeNormals(positions, indices);
            const buffers = MeshUtils.createMeshBuffers(GL, { positions, indices, normals }, attribs);
            this.models.roofPanels.push({ buffers: buffers, model: mat4.create(), color: color });
        };
        const roofPeak = [0, roofPeakY, 0]; 

        for (let x = -HALF_WIDTH; x < HALF_WIDTH; x += roofPanelWidth) {
            const p1 = [x, wallTopY, -HALF_DEPTH]; const p2 = [x + roofPanelWidth, wallTopY, -HALF_DEPTH];
            const color = wallColors[Math.abs(Math.floor(x / roofPanelWidth)) % 2];
            createRoofPanel(p1, p2, roofPeak, color);
        }
        for (let x = -HALF_WIDTH; x < HALF_WIDTH; x += roofPanelWidth) {
            const p1 = [x, wallTopY, HALF_DEPTH]; const p2 = [x + roofPanelWidth, wallTopY, HALF_DEPTH];
            const color = wallColors[Math.abs(Math.floor(x / roofPanelWidth)) % 2];
            createRoofPanel(p2, p1, roofPeak, color);
        }
        for (let z = -HALF_DEPTH; z < HALF_DEPTH; z += roofPanelWidth) {
            const p1 = [-HALF_WIDTH, wallTopY, z]; const p2 = [-HALF_WIDTH, wallTopY, z + roofPanelWidth];
            const color = wallColors[Math.abs(Math.floor(z / roofPanelWidth)) % 2];
            createRoofPanel(p2, p1, roofPeak, color);
        }
        for (let z = -HALF_DEPTH; z < HALF_DEPTH; z += roofPanelWidth) {
            const p1 = [HALF_WIDTH, wallTopY, z]; const p2 = [HALF_WIDTH, wallTopY, z + roofPanelWidth];
            const color = wallColors[Math.abs(Math.floor(z / roofPanelWidth)) % 2];
            createRoofPanel(p1, p2, roofPeak, color);
        }
        
        // =======================================================================
        // --- 9. RANGKA ATAP (FONDASI) ---
        // =======================================================================
        
        // A. TIANG VERTIKAL (DI UJUNG-UJUNG)
        const beamRadius = 3.0; 
        this.meshes.roofBeam = createMesh(MeshUtils.generateEllipticalCylinder, { 
            params: [beamRadius, beamRadius, beamRadius, beamRadius, 1.0, 16], 
            deferBuffer: false 
        });
        
        this.models.roofBeams = []; 
        const beamStartY = -3.5; 
        const beamEndY = 55.0;   
        const beamHeight = beamEndY - beamStartY + 3.5;
        const beamCenterY = (beamEndY + beamStartY) / 2;
        const beamScale = [1, beamHeight, 1]; 
        
        // 4 Sudut
        const corners = [
            [-HALF_WIDTH, beamCenterY, -HALF_DEPTH], [ HALF_WIDTH, beamCenterY, -HALF_DEPTH],
            [ HALF_WIDTH, beamCenterY,  HALF_DEPTH], [-HALF_WIDTH, beamCenterY,  HALF_DEPTH]
        ];

        for (const pos of corners) {
            this.models.roofBeams.push(createModelMatrix({ translate: pos, scale: beamScale }));
        }

        // B. BALOK ATAS (TOP FRAME) - Tiang tengah yang "diputar" jadi horizontal
        const topFrameRadius = 2.0;
        this.meshes.topFrameBeam = createMesh(MeshUtils.generateEllipticalCylinder, { 
            params: [topFrameRadius, topFrameRadius, topFrameRadius, topFrameRadius, 1.0, 16], 
            deferBuffer: false 
        });
        this.models.topFrameBeams = [];

        // 1. Balok Belakang (Sepanjang X) - Rotasi sumbu Z
        this.models.topFrameBeams.push(createModelMatrix({
            translate: [0, beamEndY, -HALF_DEPTH],
            rotate: [{ axis: 'z', angle: Math.PI / 2 }],
            scale: [1, CIRCUS_WIDTH, 1]
        }));

        // 2. Balok Depan (Sepanjang X) - Rotasi sumbu Z
        this.models.topFrameBeams.push(createModelMatrix({
            translate: [0, beamEndY, HALF_DEPTH],
            rotate: [{ axis: 'z', angle: Math.PI / 2 }],
            scale: [1, CIRCUS_WIDTH, 1]
        }));

        // 3. Balok Kiri (Sepanjang Z) - Rotasi sumbu X (Sesuai Request)
        this.models.topFrameBeams.push(createModelMatrix({
            translate: [-HALF_WIDTH, beamEndY, 0],
            rotate: [{ axis: 'x', angle: Math.PI / 2 }],
            scale: [1, CIRCUS_DEPTH, 1]
        }));

        // 4. Balok Kanan (Sepanjang Z) - Rotasi sumbu X (Sesuai Request)
        this.models.topFrameBeams.push(createModelMatrix({
            translate: [HALF_WIDTH, beamEndY, 0],
            rotate: [{ axis: 'x', angle: Math.PI / 2 }],
            scale: [1, CIRCUS_DEPTH, 1]
        }));

        // C. RANGKA DIAGONAL VERTIKAL (WALL CROSS BEAMS)
        this.models.wallCrossBeams = []; 
    }

    animate(time) {
        const speed = 0.010;
        const height = 0.3; 
        const baseWave = time * speed;

        this.initialSpectatorData.forEach((initialData, i) => {
            const isEvenPattern = (initialData.row + initialData.seat) % 2 === 0;
            const phaseShift = isEvenPattern ? 0 : Math.PI;
            const wave = (Math.sin(baseWave + phaseShift) + 1) / 2;
            const yOffset = wave * height;

            const newBodyPos = vec3.clone(initialData.body); newBodyPos[1] += yOffset;
            const newHeadPos = vec3.clone(initialData.head); newHeadPos[1] += yOffset;
            const newLeftArmPos = vec3.clone(initialData.leftArm); newLeftArmPos[1] += yOffset;
            const newRightArmPos = vec3.clone(initialData.rightArm); newRightArmPos[1] += yOffset;
            const newLeftEyePos = vec3.clone(initialData.leftEye); newLeftEyePos[1] += yOffset;
            const newRightEyePos = vec3.clone(initialData.rightEye); newRightEyePos[1] += yOffset;

            const rotationAxis = initialData.rotation === 0 ? 'z' : 'x';
            const armAngle = Math.PI / 3.5; // ~50 degrees for more active movement

            this.models.spectators[i] = {
                bodyModel: createModelMatrix({ translate: newBodyPos }),
                headModel: createModelMatrix({ translate: newHeadPos }),
                leftArmModel: createModelMatrix({ translate: newLeftArmPos, rotate: [{ axis: rotationAxis, angle: armAngle }] }),
                rightArmModel: createModelMatrix({ translate: newRightArmPos, rotate: [{ axis: rotationAxis, angle: -armAngle }] }),
                leftEyeModel: createModelMatrix({ translate: newLeftEyePos }),     
                rightEyeModel: createModelMatrix({ translate: newRightEyePos }),   
                color: this.models.spectators[i].color
            };
        });
    }

    drawObject() {
        drawObject(this.meshes.grassField.solid.buffers, this.models.grassField, [0.3, 0.6, 0.2], GL.TRIANGLES); 
        drawObject(this.meshes.basePlane.solid.buffers, this.models.basePlane, [0.878, 0.686, 0.624], GL.TRIANGLES);

        const skyColor = [0.114, 0.569, 0.831]; 
        drawObject(this.meshes.skyWall.solid.buffers, this.models.skyWallBack, skyColor, GL.TRIANGLES);
        drawObject(this.meshes.skyWall.solid.buffers, this.models.skyWallFront, skyColor, GL.TRIANGLES);
        drawObject(this.meshes.skyWall.solid.buffers, this.models.skyWallLeft, skyColor, GL.TRIANGLES);
        drawObject(this.meshes.skyWall.solid.buffers, this.models.skyWallRight, skyColor, GL.TRIANGLES);
        drawObject(this.meshes.skyRoof.solid.buffers, this.models.skyRoof, skyColor, GL.TRIANGLES);

        drawObject(this.meshes.grassField.solid.buffers, this.models.grassField, [0.3, 0.6, 0.2], GL.TRIANGLES);

        // Gambar Pagar yang Sudah Disesuaikan
        drawObject(this.meshes.fenceLong.solid.buffers, this.models.fenceFront, [0, 0, 0], GL.TRIANGLES);
        drawObject(this.meshes.fenceLong.solid.buffers, this.models.fenceBack, [0, 0, 0], GL.TRIANGLES);
        drawObject(this.meshes.fenceShort.solid.buffers, this.models.fenceLeft, [0, 0, 0], GL.TRIANGLES);
        drawObject(this.meshes.fenceShort.solid.buffers, this.models.fenceRight, [0, 0, 0], GL.TRIANGLES);

        drawObject(this.meshes.basePlane.solid.buffers, this.models.basePlane, [0.878, 0.686, 0.624], GL.TRIANGLES);   

        drawObject(this.meshes.stageFloor.solid.buffers, this.models.stageFloor, [0.2, 0.2, 0.25], GL.TRIANGLES);

        for (const plankModel of this.models.planks) {
            drawObject(this.meshes.woodPlank.solid.buffers, plankModel, [0.4, 0.25, 0.15], GL.TRIANGLES);
        }

        drawObject(this.meshes.spotlightPool.solid.buffers, this.models.spotlightPool1, [0.8, 0.8, 0.6], GL.TRIANGLES);
        drawObject(this.meshes.spotlightPool.solid.buffers, this.models.spotlightPool2, [0.8, 0.8, 0.6], GL.TRIANGLES);
        drawObject(this.meshes.spotlightPool.solid.buffers, this.models.spotlightPool3, [0.8, 0.8, 0.6], GL.TRIANGLES);

        // Gambar Platform Panjang
        for (const platformModel of this.models.platformsLong) {
            drawObject(this.meshes.platformLong.solid.buffers, platformModel, [0.3, 0.3, 0.35], GL.TRIANGLES);
        }
        // Gambar Platform Pendek
        for (const platformModel of this.models.platformsShort) {
            drawObject(this.meshes.platformShort.solid.buffers, platformModel, [0.3, 0.3, 0.35], GL.TRIANGLES);
        }

        // Gambar Fondasi
        for (const foundationModel of this.models.foundations) {
            drawObject(this.meshes.foundation.solid.buffers, foundationModel, [0.25, 0.25, 0.3], GL.TRIANGLES);
        }

        const skinTone = [0.85, 0.7, 0.62]; 
        this.models.spectators.forEach((spectator) => {
            const bodyColor = spectator.color;
            drawObject(this.meshes.spectatorBody.solid.buffers, spectator.bodyModel, bodyColor, GL.TRIANGLES);
            drawObject(this.meshes.spectatorHead.solid.buffers, spectator.headModel, skinTone, GL.TRIANGLES);
            drawObject(this.meshes.spectatorArm.solid.buffers, spectator.leftArmModel, skinTone, GL.TRIANGLES);
            drawObject(this.meshes.spectatorArm.solid.buffers, spectator.rightArmModel, skinTone, GL.TRIANGLES);
            const eyeColor = [0.1, 0.1, 0.1];
            drawObject(this.meshes.spectatorEye.solid.buffers, spectator.leftEyeModel, eyeColor, GL.TRIANGLES);
            drawObject(this.meshes.spectatorEye.solid.buffers, spectator.rightEyeModel, eyeColor, GL.TRIANGLES);
        });
        
        for (const panel of this.models.wallPanels) {
            drawObject(this.meshes.wallPanel.solid.buffers, panel.model, panel.color, GL.TRIANGLES);
        }

        for (const panel of this.models.roofPanels) {
            drawObject(panel.buffers, panel.model, panel.color, GL.TRIANGLES);
        }
        
        const ironColor = [0.2, 0.2, 0.25]; 
        for (const beamModel of this.models.roofBeams) {
            drawObject(this.meshes.roofBeam.solid.buffers, beamModel, ironColor, GL.TRIANGLES);
        }
        for (const frameModel of this.models.topFrameBeams) {
            drawObject(this.meshes.topFrameBeam.solid.buffers, frameModel, ironColor, GL.TRIANGLES);
        }
    }
}