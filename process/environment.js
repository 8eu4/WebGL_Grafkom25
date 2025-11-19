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

export class env extends BaseCharacter {
    constructor() {
        super();
        this.meshes = {};
        this.models = {};

        // === DEFINISI WARNA ===
        const clothingColors = [
            [0.8, 0.2, 0.2], [0.2, 0.3, 0.8], [0.1, 0.5, 0.2], [0.8, 0.8, 0.1], [0.5, 0.2, 0.8],
            [0.9, 0.5, 0.1], [0.2, 0.8, 0.8], [0.8, 0.4, 0.7], [0.3, 0.3, 0.3], [0.9, 0.9, 0.9]
        ];

        const CIRCUS_WIDTH = 300; 
        const CIRCUS_DEPTH = 200; 

        const HALF_WIDTH = CIRCUS_WIDTH / 2;
        const HALF_DEPTH = CIRCUS_DEPTH / 2;

        // Dimensi Tribun
        const TRIBUNE_DIM_X = CIRCUS_WIDTH * 0.8; 
        const TRIBUNE_DIM_Z = CIRCUS_DEPTH * 0.8; 

        const standMarginX = (CIRCUS_WIDTH - TRIBUNE_DIM_X) / 2;
        const standMarginZ = (CIRCUS_DEPTH - TRIBUNE_DIM_Z) / 2;

        // === 1. PANGGUNG LINGKARAN (PUTIH BERSIH) ===
        const stageRadius = 50; 
        const stageHeight = 4.0; 
        
        // A. Mesh Panggung Utama (Bawah)
        this.meshes.stageFloor = createMesh(MeshUtils.generateEllipticalCylinder, { 
            params: [stageRadius, stageRadius, stageRadius, stageRadius, stageHeight, 64], 
            deferBuffer: false 
        });
        this.models.stageFloor = createModelMatrix({ translate: [0, -1.55, 0] });

        // B. Mesh Layer Atas (Putih & Lebih Kecil)
        const topLayerRadius = stageRadius - 2.0; 
        const topLayerHeight = 0.2; 
        this.meshes.stageWhiteTop = createMesh(MeshUtils.generateEllipticalCylinder, {
            params: [topLayerRadius, topLayerRadius, topLayerRadius, topLayerRadius, topLayerHeight, 64],
            deferBuffer: false
        });
        this.models.stageWhiteTop = createModelMatrix({ translate: [0, 0.55, 0] });

        // C. Mesh Dekorasi Trim (Cincin Emas)
        const trimRadius = stageRadius + 0.5; 
        const trimHeight = 0.5;
        this.meshes.stageTrim = createMesh(MeshUtils.generateEllipticalCylinder, {
            params: [trimRadius, trimRadius, trimRadius, trimRadius, trimHeight, 64],
            deferBuffer: false
        });
        this.models.stageTrimTop = createModelMatrix({ translate: [0, 0.25, 0] });
        this.models.stageTrimBottom = createModelMatrix({ translate: [0, -3.25, 0] });

        // Hapus papan kayu lama
        this.models.planks = []; 

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

        // Dinding Belakang & Depan
        for (let x = -HALF_WIDTH; x < HALF_WIDTH; x += panelWidth) {
            const color = wallColors[Math.abs(Math.floor(x / panelWidth)) % 2];
            this.models.wallPanels.push({ model: createModelMatrix({ translate: [x + panelWidth / 2, wallHeight - 3.5, -HALF_DEPTH] }), color });
        }
        for (let x = -HALF_WIDTH; x < HALF_WIDTH; x += panelWidth) {
            const color = wallColors[Math.abs(Math.floor(x / panelWidth)) % 2];
            this.models.wallPanels.push({ model: createModelMatrix({ translate: [x + panelWidth / 2, wallHeight - 3.5, HALF_DEPTH] }), color });
        }
        // Dinding Kiri & Kanan
        for (let z = -HALF_DEPTH; z < HALF_DEPTH; z += panelWidth) {
            const color = wallColors[Math.abs(Math.floor(z / panelWidth)) % 2];
            this.models.wallPanels.push({ model: createModelMatrix({ translate: [-HALF_WIDTH, wallHeight - 3.5, z + panelWidth / 2], rotate: [{ axis: 'y', angle: Math.PI / 2 }] }), color });
        }
        for (let z = -HALF_DEPTH; z < HALF_DEPTH; z += panelWidth) {
            const color = wallColors[Math.abs(Math.floor(z / panelWidth)) % 2];
            this.models.wallPanels.push({ model: createModelMatrix({ translate: [HALF_WIDTH, wallHeight - 3.5, z + panelWidth / 2], rotate: [{ axis: 'y', angle: Math.PI / 2 }] }), color });
        }

        this.meshes.spotlightPool = createMesh(MeshUtils.generateEllipticalCylinder, { params: [5, 5, 0.1, 0.1, 0.1, 64], deferBuffer: false });
        this.models.spotlightPool1 = createModelMatrix({ translate: [0, -2.7, 0] });
        this.models.spotlightPool2 = createModelMatrix({ translate: [20, -2.7, 0] });
        this.models.spotlightPool3 = createModelMatrix({ translate: [-20, -2.7, 0] });

        // --- TRIBUN ---
        this.meshes.platformLong = createMesh(MeshUtils.generateBox, { params: [TRIBUNE_DIM_X, 1, 3], deferBuffer: false });
        this.meshes.platformShort = createMesh(MeshUtils.generateBox, { params: [TRIBUNE_DIM_Z, 1, 3], deferBuffer: false });

        // === FONDASI TRIBUN ===
        this.meshes.foundation = createMesh(MeshUtils.generateEllipticalCylinder, { 
            params: [0.8, 0.8, 0.8, 0.8, 1.0, 16], 
            deferBuffer: false 
        });
        this.models.foundations = [];

        // === MESH PENONTON & PROPERTI ===
        this.meshes.spectatorBody = createMesh(MeshUtils.generateEllipsoid, { params: [2, 5, 2, 8, 16], deferBuffer: false });
        this.meshes.spectatorHead = createMesh(MeshUtils.generateEllipsoid, { params: [1.4, 1.4, 1.4, 8, 16], deferBuffer: false });
        this.meshes.spectatorArm = createMesh(MeshUtils.generateEllipticalCylinder, { params: [0.2, 0.2, 0.3, 0.3, 3, 32, 1, true], deferBuffer: false });
        this.meshes.spectatorEye = createMesh(MeshUtils.generateEllipsoid, { params: [0.1, 0.3, 0.1, 8, 8], deferBuffer: false });
        this.meshes.propCup = createMesh(MeshUtils.generateEllipticalCylinder, { params: [0.4, 0.4, 0.3, 0.3, 1.2, 12], deferBuffer: false });

        // === DEKORASI PAGAR ===
        const fenceY = 0.5; 
        const fenceOffset = 15.0; 
        
        const posFenceFront = (HALF_DEPTH - standMarginZ) - fenceOffset;
        const posFenceBack = -(HALF_DEPTH - standMarginZ) + fenceOffset;
        const posFenceLeft = -(HALF_WIDTH - standMarginX) + fenceOffset;
        const posFenceRight = (HALF_WIDTH - standMarginX) - fenceOffset;

        const fenceGap = -2.0; 
        const fenceLengthLong = 2 * Math.abs(posFenceRight) - fenceGap;
        const fenceLengthShort = 2 * Math.abs(posFenceFront) - fenceGap;

        this.meshes.fenceLong = createMesh(MeshUtils.generateBox, { params: [fenceLengthLong, 8, 0.5], deferBuffer: false });
        this.meshes.fenceShort = createMesh(MeshUtils.generateBox, { params: [fenceLengthShort, 8, 0.5], deferBuffer: false });
        
        // Mesh Bendera
        this.meshes.flag = createMesh(MeshUtils.generateCone, { params: [0.8, 1.5, 4], deferBuffer: false }); 
        this.models.flags = [];
        
        this.models.fenceFront = createModelMatrix({ translate: [0, fenceY, posFenceFront] });
        this.models.fenceBack = createModelMatrix({ translate: [0, fenceY, posFenceBack] });
        this.models.fenceLeft = createModelMatrix({ translate: [posFenceLeft, fenceY, 0], rotate: [{ axis: 'y', angle: Math.PI / 2 }] });
        this.models.fenceRight = createModelMatrix({ translate: [posFenceRight, fenceY, 0], rotate: [{ axis: 'y', angle: Math.PI / 2 }] });

        // Generate Bendera di Pagar
        const createFlagsOnFence = (startX, startZ, length, isRotated) => {
            const flagSpacing = 2.0;
            const numFlags = Math.floor(length / flagSpacing);
            const flagY = fenceY + 4; 
            
            for (let i = 0; i < numFlags; i++) {
                const offset = -length/2 + i * flagSpacing;
                let pos, rotY;
                
                if (isRotated) { 
                    pos = [startX, flagY, startZ + offset];
                    rotY = (startX > 0) ? -Math.PI/2 : Math.PI/2; 
                } else { 
                    pos = [startX + offset, flagY, startZ];
                    rotY = (startZ > 0) ? 0 : Math.PI;
                }

                this.models.flags.push({
                    model: createModelMatrix({
                        translate: pos,
                        rotate: [
                            { axis: 'y', angle: rotY },
                            { axis: 'z', angle: Math.PI } 
                        ]
                    }),
                    color: clothingColors[i % clothingColors.length] 
                });
            }
        };

        createFlagsOnFence(0, posFenceFront, fenceLengthLong, false);
        createFlagsOnFence(0, posFenceBack, fenceLengthLong, false);
        createFlagsOnFence(posFenceLeft, 0, fenceLengthShort, true);
        createFlagsOnFence(posFenceRight, 0, fenceLengthShort, true);


        this.models.platformsLong = [];
        this.models.platformsShort = [];
        this.models.spectatorBodies = [];
        this.models.spectatorHeads = [];
        this.initialSpectatorData = []; 
        this.models.spectators = []; 
        this.models.props = []; 

        const rows = 4;
        const rowHeight = 2.5;
        const rowDepth = 5.0;

        // Fungsi Pembantu Generik
        const createAudienceSide = (config) => {
            const seatingWidth = config.totalWidth - 40; 
            const spectatorSpacing = seatingWidth / (config.seatsCount - 1);
            const groundY = -3.5; 

            for (let r = 0; r < rows; r++) {
                const platformPos = vec3.clone(config.startPos);
                vec3.scaleAndAdd(platformPos, platformPos, config.depthDir, r * rowDepth);
                vec3.scaleAndAdd(platformPos, platformPos, [0, 1, 0], r * rowHeight);
                
                if (config.type === 'long') {
                    this.models.platformsLong.push(createModelMatrix({ translate: platformPos, rotate: [{ axis: 'y', angle: config.rotation }] }));
                } else {
                    this.models.platformsShort.push(createModelMatrix({ translate: platformPos, rotate: [{ axis: 'y', angle: config.rotation }] }));
                }

                // Generate Fondasi
                const foundationSpacing = 25;
                const numFoundations = Math.floor(config.totalWidth / foundationSpacing);
                const foundationCount = Math.max(2, numFoundations);
                const currentPlatformY = platformPos[1];
                const foundationHeight = currentPlatformY - groundY;

                if (foundationHeight > 0.5) {
                    for (let k = 0; k <= foundationCount; k++) {
                        const t = k / foundationCount;
                        const offset = -(config.totalWidth / 2) + 2 + t * (config.totalWidth - 4);
                        const fPos = vec3.clone(platformPos);
                        vec3.scaleAndAdd(fPos, fPos, config.rowDir, offset);
                        fPos[1] = groundY + foundationHeight / 2;
                        this.models.foundations.push(createModelMatrix({
                            translate: fPos,
                            scale: [1, foundationHeight, 1]
                        }));
                    }
                }

                const firstSeatPos = vec3.clone(platformPos);
                vec3.scaleAndAdd(firstSeatPos, firstSeatPos, config.rowDir, -seatingWidth / 2);
                vec3.add(firstSeatPos, firstSeatPos, [0, 5, 0]);

                for (let s = 0; s < config.seatsCount; s++) {
                    const scale = 0.7 + Math.random() * 0.4; 
                    const yAdjust = 5 * (scale - 1); 

                    const bodyPos = vec3.clone(firstSeatPos);
                    vec3.scaleAndAdd(bodyPos, bodyPos, config.rowDir, s * spectatorSpacing);
                    bodyPos[1] += yAdjust; 

                    const headPos = vec3.clone(bodyPos); 
                    vec3.add(headPos, headPos, [0, 5.5 * scale, 0]); 

                    let armOffsetX, armOffsetZ, rotationAxis;
                    const armY = 4 * scale; 
                    const armDist = 1.9 * scale; 
                    const armDistr = -1.9 * scale;
                    
                    if (config.rotation === 0) { armOffsetX = armDist; armOffsetZ = 0; rotationAxis = 'z'; } 
                    else { armOffsetX = 0; armOffsetZ = armDistr; rotationAxis = 'x'; }
                    
                    const leftArmPos = vec3.clone(bodyPos); vec3.add(leftArmPos, leftArmPos, [-armOffsetX, armY, -armOffsetZ]);
                    const rightArmPos = vec3.clone(bodyPos); vec3.add(rightArmPos, rightArmPos, [armOffsetX, armY, armOffsetZ]);
                    
                    let leftEyePos, rightEyePos; 
                    const eyeYOffset = 0.2 * scale; 
                    const eyeForwardDist = 1.3 * scale; 
                    const eyeSpacing = 0.5 * scale;

                    if (config.rotation === 0) { 
                        let actualEyeForwardDist = (config.startPos[2] < 0) ? eyeForwardDist : -eyeForwardDist;
                        leftEyePos = vec3.add(vec3.create(), headPos, [-eyeSpacing, eyeYOffset, actualEyeForwardDist]);
                        rightEyePos = vec3.add(vec3.create(), headPos, [eyeSpacing, eyeYOffset, actualEyeForwardDist]);
                    } else { 
                        const faceDirection = config.startPos[0] > 0 ? -1 : 1; 
                        leftEyePos = vec3.add(vec3.create(), headPos, [eyeForwardDist * faceDirection, eyeYOffset, -eyeSpacing]);
                        rightEyePos = vec3.add(vec3.create(), headPos, [eyeForwardDist * faceDirection, eyeYOffset, eyeSpacing]);
                    }
                    
                    this.initialSpectatorData.push({ body: vec3.clone(bodyPos), head: vec3.clone(headPos), leftArm: vec3.clone(leftArmPos), rightArm: vec3.clone(rightArmPos), leftEye: vec3.clone(leftEyePos), rightEye: vec3.clone(rightEyePos), row: r, seat: s, rotation: config.rotation, scale: scale });
                    const randomColor = clothingColors[Math.floor(Math.random() * clothingColors.length)];
                    
                    const scaleVec = [scale, scale, scale];
                    
                    this.models.spectators.push({ 
                        bodyModel: createModelMatrix({ translate: bodyPos, scale: scaleVec }), 
                        headModel: createModelMatrix({ translate: headPos, scale: scaleVec }), 
                        leftArmModel: createModelMatrix({ scale: scaleVec }), 
                        rightArmModel: createModelMatrix({ scale: scaleVec }), 
                        leftEyeModel: createModelMatrix({ translate: leftEyePos, scale: scaleVec }), 
                        rightEyeModel: createModelMatrix({ translate: rightEyePos, scale: scaleVec }), 
                        color: randomColor 
                    });

                    if (Math.random() > 0.7) {
                        this.models.props.push({
                            parentIndex: this.models.spectators.length - 1, 
                            color: (Math.random() > 0.5) ? [1, 1, 1] : [0.8, 0.2, 0.1] 
                        });
                    }
                }
            }
        };

        createAudienceSide({ type: 'long', totalWidth: TRIBUNE_DIM_X, seatsCount: 20, startPos: [0, -2, -(HALF_DEPTH - standMarginZ)], depthDir: [0, 0, -1], rowDir: [1, 0, 0], rotation: 0 }); 
        createAudienceSide({ type: 'long', totalWidth: TRIBUNE_DIM_X, seatsCount: 20, startPos: [0, -2, (HALF_DEPTH - standMarginZ)], depthDir: [0, 0, 1], rowDir: [-1, 0, 0], rotation: 0 }); 
        createAudienceSide({ type: 'short', totalWidth: TRIBUNE_DIM_Z, seatsCount: 12, startPos: [-(HALF_WIDTH - standMarginX), -2, 0], depthDir: [-1, 0, 0], rowDir: [0, 0, -1], rotation: Math.PI / 2 }); 
        createAudienceSide({ type: 'short', totalWidth: TRIBUNE_DIM_Z, seatsCount: 12, startPos: [(HALF_WIDTH - standMarginX), -2, 0], depthDir: [1, 0, 0], rowDir: [0, 0, 1], rotation: Math.PI / 2 }); 

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
        
        // A. TIANG VERTIKAL
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
        
        const corners = [
            [-HALF_WIDTH, beamCenterY, -HALF_DEPTH], [ HALF_WIDTH, beamCenterY, -HALF_DEPTH],
            [ HALF_WIDTH, beamCenterY,  HALF_DEPTH], [-HALF_WIDTH, beamCenterY,  HALF_DEPTH]
        ];

        for (const pos of corners) {
            this.models.roofBeams.push(createModelMatrix({ translate: pos, scale: beamScale }));
        }

        // B. BALOK ATAS
        const topFrameRadius = 2.0;
        this.meshes.topFrameBeam = createMesh(MeshUtils.generateEllipticalCylinder, { 
            params: [topFrameRadius, topFrameRadius, topFrameRadius, topFrameRadius, 1.0, 16], 
            deferBuffer: false 
        });
        this.models.topFrameBeams = [];

        this.models.topFrameBeams.push(createModelMatrix({ translate: [0, beamEndY, -HALF_DEPTH], rotate: [{ axis: 'z', angle: Math.PI / 2 }], scale: [1, CIRCUS_WIDTH, 1] }));
        this.models.topFrameBeams.push(createModelMatrix({ translate: [0, beamEndY, HALF_DEPTH], rotate: [{ axis: 'z', angle: Math.PI / 2 }], scale: [1, CIRCUS_WIDTH, 1] }));
        this.models.topFrameBeams.push(createModelMatrix({ translate: [-HALF_WIDTH, beamEndY, 0], rotate: [{ axis: 'x', angle: Math.PI / 2 }], scale: [1, CIRCUS_DEPTH, 1] }));
        this.models.topFrameBeams.push(createModelMatrix({ translate: [HALF_WIDTH, beamEndY, 0], rotate: [{ axis: 'x', angle: Math.PI / 2 }], scale: [1, CIRCUS_DEPTH, 1] }));

        // C. CROSS BEAMS (DIAGONAL) - Rangka Silang di Atas
        const diagLength = Math.hypot(CIRCUS_WIDTH, CIRCUS_DEPTH);
        const diagAngle = Math.atan2(CIRCUS_DEPTH, CIRCUS_WIDTH);

        // Diagonal 1 (Kiri Depan ke Kanan Belakang)
        this.models.topFrameBeams.push(createModelMatrix({
            translate: [0, beamEndY, 0],
            rotate: [
                { axis: 'y', angle: diagAngle },
                { axis: 'z', angle: Math.PI / 2 }
            ],
            scale: [1, diagLength, 1]
        }));

        // Diagonal 2 (Kanan Depan ke Kiri Belakang)
        this.models.topFrameBeams.push(createModelMatrix({
            translate: [0, beamEndY, 0],
            rotate: [
                { axis: 'y', angle: -diagAngle },
                { axis: 'z', angle: Math.PI / 2 }
            ],
            scale: [1, diagLength, 1]
        }));

        // D. CENTER POLE (TIANG TENGAH GANTUNG)
        const poleRadius = 1.2; // Sedikit lebih kecil dari frame lain (2.0)
        const poleHeight = roofPeakY - beamEndY; // Dari level balok ke puncak atap (85 - 55 = 30)
        const poleCenterY = beamEndY + (poleHeight / 2); // Titik tengah batang

        this.meshes.centerPole = createMesh(MeshUtils.generateEllipticalCylinder, {
            params: [poleRadius, poleRadius, poleRadius, poleRadius, 1.0, 16], // Height 1, nanti di-scale
            deferBuffer: false
        });

        this.models.centerPoles = [];
        this.models.centerPoles.push(createModelMatrix({
            translate: [0, poleCenterY, 0],
            scale: [1, poleHeight, 1]
        }));

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
            const armAngle = Math.PI / 3.5; 

            const scaleVec = [initialData.scale, initialData.scale, initialData.scale];

            this.models.spectators[i] = {
                bodyModel: createModelMatrix({ translate: newBodyPos, scale: scaleVec }),
                headModel: createModelMatrix({ translate: newHeadPos, scale: scaleVec }),
                leftArmModel: createModelMatrix({ translate: newLeftArmPos, rotate: [{ axis: rotationAxis, angle: armAngle }], scale: scaleVec }),
                rightArmModel: createModelMatrix({ translate: newRightArmPos, rotate: [{ axis: rotationAxis, angle: -armAngle }], scale: scaleVec }),
                leftEyeModel: createModelMatrix({ translate: newLeftEyePos, scale: scaleVec }),     
                rightEyeModel: createModelMatrix({ translate: newRightEyePos, scale: scaleVec }),   
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

        drawObject(this.meshes.fenceLong.solid.buffers, this.models.fenceFront, [0, 0, 0], GL.TRIANGLES);
        drawObject(this.meshes.fenceLong.solid.buffers, this.models.fenceBack, [0, 0, 0], GL.TRIANGLES);
        drawObject(this.meshes.fenceShort.solid.buffers, this.models.fenceLeft, [0, 0, 0], GL.TRIANGLES);
        drawObject(this.meshes.fenceShort.solid.buffers, this.models.fenceRight, [0, 0, 0], GL.TRIANGLES);

        // Gambar Bendera
        for (const flag of this.models.flags) {
            drawObject(this.meshes.flag.solid.buffers, flag.model, flag.color, GL.TRIANGLES);
        }

        drawObject(this.meshes.basePlane.solid.buffers, this.models.basePlane, [0.878, 0.686, 0.624], GL.TRIANGLES);   
        
        // 1. Gambar Panggung Utama (Bawah) - MERAH MARUN
        drawObject(this.meshes.stageFloor.solid.buffers, this.models.stageFloor, [0.6, 0.1, 0.2], GL.TRIANGLES);
        
        // 2. Gambar Layer Atas (Top) - PUTIH
        drawObject(this.meshes.stageWhiteTop.solid.buffers, this.models.stageWhiteTop, [0.95, 0.95, 0.95], GL.TRIANGLES);

        // 3. Gambar Trim Emas
        const goldColor = [0.85, 0.75, 0.3];
        drawObject(this.meshes.stageTrim.solid.buffers, this.models.stageTrimTop, goldColor, GL.TRIANGLES);
        drawObject(this.meshes.stageTrim.solid.buffers, this.models.stageTrimBottom, goldColor, GL.TRIANGLES);

        drawObject(this.meshes.spotlightPool.solid.buffers, this.models.spotlightPool1, [0.8, 0.8, 0.6], GL.TRIANGLES);
        drawObject(this.meshes.spotlightPool.solid.buffers, this.models.spotlightPool2, [0.8, 0.8, 0.6], GL.TRIANGLES);
        drawObject(this.meshes.spotlightPool.solid.buffers, this.models.spotlightPool3, [0.8, 0.8, 0.6], GL.TRIANGLES);

        for (const platformModel of this.models.platformsLong) {
            drawObject(this.meshes.platformLong.solid.buffers, platformModel, [0.3, 0.3, 0.35], GL.TRIANGLES);
        }
        for (const platformModel of this.models.platformsShort) {
            drawObject(this.meshes.platformShort.solid.buffers, platformModel, [0.3, 0.3, 0.35], GL.TRIANGLES);
        }

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

        // Gambar Properti
        for (const prop of this.models.props) {
            const parentArmModel = this.models.spectators[prop.parentIndex].rightArmModel;
            drawObject(this.meshes.propCup.solid.buffers, parentArmModel, prop.color, GL.TRIANGLES);
        }
        
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

        // Gambar Center Pole
        for (const pole of this.models.centerPoles) {
            drawObject(this.meshes.centerPole.solid.buffers, pole, ironColor, GL.TRIANGLES);
        }
    }
}