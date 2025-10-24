import { BaseCharacter } from '/process/BaseCharacter.js';
import { createModelMatrix, createMesh, drawObject, applyTransformToMesh, recenterMesh, cutMesh } from '../CreateObject.js';
import { MeshUtilsCurves, rotateAroundAxis } from '../MeshUtilsCurves.js';
import { MeshUtils } from '../MeshUtils.js';
import * as Curves from '../curves.js';
import { meshToCSG, CSGBuilder } from "../csgOperation.js";
import { makeModel, applyBoneOffsetMesh, getAxisAngle, setLocalRotationAxisAngle } from "../bone.js";
import { GL, attribs } from '../main.js'

export class mr_rime extends BaseCharacter {
    constructor() {
        super();

        const wingsHatCurve = Curves.cubicBezier3D(
            [0, 0, 0],   // p0 (awal)
            [-0.5, 0.1, 0],   // p1 (kontrol 1)
            [-1, 0.4, 0], // p2 (kontrol 2)
            [-1.2, 0.5, 0]    // p3 (akhir)
        );

        const staffPoints = [
            [3.3, 0.6, 0],   // P0
            [3, 1, 0],   // P1
            [2.5, 1.2, 0],   // P2
            [2, 1, 0],   // P3
            [2, 0, 0],  // P4
            [2.7, -0.6, 0],  // P5
            [2.3, -2, 0],   // P6
            [2.5, -4, 0],   // P7
            [2.4, -5, 0],  // P8
        ];


        //MESH 
        this.meshes = {
            // upperHat: upperHat,

            //HAT

            upperHat: createMesh(MeshUtils.generateEllipsoid, { params: [1, 1, 1, 32, 64], deferBuffer: false }),
            lowerHat: createMesh(MeshUtils.generateTorus, { params: [1.2, 0.3, 64, 24], deferBuffer: false }),
            wingCurvesHat: createMesh(MeshUtilsCurves.generateVariableTube, {
                params: [wingsHatCurve, 0, 1, 50, [0.15, 0.2, 0.25], 24, { capped: true }],
                deferBuffer: false
            }),
            wingHat: createMesh(MeshUtils.generateEllipticParaboloid, { params: [1, 0.6, 7, 1.2, 32, 32], deferBuffer: false }),
            wingCurveConnect: createMesh(MeshUtils.generateEllipsoid, { params: [0.245, 0.245, 0.25, 32, 64], deferBuffer: false }),


            lowerBody: createMesh(MeshUtils.generateEllipsoid, { params: [2.25, 1.85, 2.05, 32, 64], deferBuffer: false }),
            whiteBelly: createMesh(MeshUtils.generateEllipsoid, { params: [1.6, 1.6, 1, 32, 64], deferBuffer: false }),
            redBelly: createMesh(MeshUtils.generateEllipsoid, { params: [0.9, 0.7, 0.5, 32, 64], deferBuffer: false }),
            yellowBelly: createMesh(MeshUtils.generateEllipsoid, { params: [0.3, 0.4, 0.3, 32, 64], deferBuffer: false }),

            // blackClothes:createMesh(MeshUtils.generateEllipsoid, { params: [1.6, 1.9, 1.6, 32, 64], deferBuffer: false }),
            // backblackClothes:createMesh(MeshUtils.generateEllipsoid, { params: [2, 2, 1.5, 32, 64], deferBuffer: false }),
            // backblackClothes:createMesh(MeshUtils.generateEllipsoid, { params: [2, 2, 1.5, 32, 64], deferBuffer: false }),

            //HEAD
            blackHead: createMesh(MeshUtils.generateEllipsoid, { params: [1.3, 1, 1, 32, 64], deferBuffer: false }),
            face: createMesh(MeshUtils.generateEllipsoid, { params: [1.17, 0.95, 1, 32, 64], deferBuffer: false }),

            eyes: createMesh(MeshUtils.generateEllipsoid, { params: [0.3, 0.38, 0.1, 32, 64], deferBuffer: false }),

            upperMustache: createMesh(MeshUtils.generateEllipticalCone, { params: [0.5, 0.1, 0.35, 32], deferBuffer: false }),
            lowerMustache: createMesh(MeshUtils.generateEllipticParaboloid, { params: [0.8, 0.3, 1, 0.1, 32, 16], deferBuffer: false }),

            //BODY
            upperBlackClothes: createMesh(MeshUtils.generateEllipticParaboloid, { params: [1.8, 1.6, 1.8, 1.2, 32, 16], deferBuffer: false }),
            sideBlackShoulder: createMesh(MeshUtils.generateEllipsoid, { params: [0.45, 0.45, 0.45, 32, 64], deferBuffer: false }),


            sideBlackClothes: createMesh(MeshUtils.generateEllipticParaboloid, { params: [2.7, 3, 3, 1.6, 32, 16], deferBuffer: false }),
            backBlackClothes: createMesh(MeshUtils.generateEllipsoid, { params: [1.6, 1.8, 1, 32, 64], deferBuffer: false }),

            arm: createMesh(MeshUtils.generateEllipticalCylinder, { params: [0.15, 0.15, 0.15, 0.15, 1.6, 32, 1, true], deferBuffer: false }),
            elbow: createMesh(MeshUtils.generateEllipsoid, { params: [0.15, 0.15, 0.15, 32, 64], deferBuffer: false }),

            // HANDS
            fingers: createMesh(MeshUtils.generateEllipsoid, { params: [0.45, 0.45, 0.2, 32, 64], deferBuffer: false }),
            hands: createMesh(MeshUtils.generateEllipsoid, { params: [0.5, 0.4, 0.2, 32, 64], deferBuffer: false }),
            thumbs: createMesh(MeshUtils.generateEllipsoid, { params: [0.4, 0.2, 0.2, 32, 64], deferBuffer: false }),

            // LEGS
            upperLegs: createMesh(MeshUtils.generateEllipsoid, { params: [0.8, 0.8, 0.8, 32, 64], deferBuffer: false }),
            lowerLegs: createMesh(MeshUtils.generateEllipsoid, { params: [0.2, 0.2, 0.2, 32, 64], deferBuffer: false }),

            blackShoes: createMesh(MeshUtils.generateEllipsoid, { params: [0.3, 0.3, 0.3, 32, 64], deferBuffer: false }),

            iceShoes: createMesh(MeshUtils.generateEllipsoid, { params: [0.4, 0.4, 0.4, 32, 64], deferBuffer: false }),
            connectShoes: createMesh(MeshUtils.generateEllipticalCylinder, { params: [0.37, 0.33, 0.2, 0.2, 0.8, 64, 1, true], deferBuffer: false }),
            shoePads: createMesh(MeshUtils.generateEllipsoid, { params: [0.2, 0.1, 0.4, 32, 64], deferBuffer: false }),

            staff: createMesh(MeshUtilsCurves.generateVariableTube, {
                params: [(t) => Curves.generateBSpline(staffPoints, 1, t), 0, 1, 100, [0.1, 0.2, 0.2, 0.1], 24, { capped: true }]
            })

        }

        this.offsetMesh = {


            //HAT
            lowerHatOffset: createModelMatrix({
                translate: [0, 0.6, 0]
            }),
            upperHatOffset: createModelMatrix({
                translate: [0, 0.8, 0]
            }),


            //WINGSHAT
            rightWingCurvesHatOffset: createModelMatrix({
                translate: [-1.4, 0.7, 0],
                rotate: [
                    { axis: "z", angle: Math.PI / -8 },
                ]
            }),
            leftWingCurvesHatOffset: createModelMatrix({
                translate: [1.4, 0.7, 0],

                rotate: [
                    { axis: "y", angle: Math.PI },
                    { axis: "z", angle: Math.PI / -8 },
                ]
            }),

            leftWingOffset1: createModelMatrix({
                translate: [-3.2, 0.7, 0],
                rotate: [
                    { axis: "x", angle: Math.PI / -2 },
                    { axis: "y", angle: Math.PI / 3.9 }
                ]
            }),
            leftWingOffset2: createModelMatrix({
                translate: [-2.5, 0.15, 0],
                rotate: [
                    { axis: "x", angle: Math.PI / -2 },
                    { axis: "y", angle: Math.PI / 4.4 }
                ],
                scale: [0.8, 0.8, 0.8]
            }),
            rightWingOffset1: createModelMatrix({
                translate: [3.2, 0.7, 0],
                rotate: [
                    { axis: "x", angle: Math.PI / -2 },
                    { axis: "y", angle: Math.PI / -3.9 }
                ]
            }),
            rightWingOffset2: createModelMatrix({
                translate: [2.5, 0.15, 0],
                rotate: [
                    { axis: "x", angle: Math.PI / -2 },
                    { axis: "y", angle: Math.PI / -4.4 }
                ],
                scale: [0.8, 0.8, 0.8]
            }),


            rightWingCurveConnectOffset: createModelMatrix({
                translate: [-2.4, 1.68, 0],
            }),
            leftWingCurveConnectOffset: createModelMatrix({
                translate: [2.4, 1.68, 0],
            }),




            lowerBodyOffset: createModelMatrix({
                translate: [0, -0.7, 0]
            }),
            whiteBellyOffset: createModelMatrix({
                translate: [0, -0.3, 1.1]
            }),


            //UPPER
            upperBlackClothesOffset: createModelMatrix({
                translate: [0, 0.15, 0],
                rotate: [
                    { axis: "x", angle: Math.PI / 2 },
                ]
            }),

            rightShoulderOffset: createModelMatrix({
                translate: [0, 0, 0],

            }),

            leftShoulderOffset: createModelMatrix({
                translate: [0, 0, 0],
            }),

            //HEAD
            blackHeadOffset: createModelMatrix({
                translate: [0, 0, 0],
            }),
            faceOffset: createModelMatrix({
                translate: [0, 0, 0.1],
            }),

            //MUSTACHE
            upperMustacheOffset: createModelMatrix({
                translate: [0, -0.35, 1.1],
            }),
            rightLowerMustacheOffset: createModelMatrix({
                translate: [-0.25, -0.45, 1.1],
                rotate: [
                    { axis: "x", angle: Math.PI / -2 }
                ]
            }),
            leftLowerMustacheOffset: createModelMatrix({
                translate: [0.25, -0.45, 1.1],
                rotate: [
                    { axis: "x", angle: Math.PI / -2 }
                ]
            }),

            //EYES
            outerWhiteRightEye: createModelMatrix({
                translate: [-0.4, 0.05, 1],
                rotate: [
                    { axis: "y", angle: Math.PI / -16 }
                ]
            }),
            outerWhiteLeftEye: createModelMatrix({
                translate: [0.4, 0.05, 1],
                rotate: [
                    { axis: "y", angle: Math.PI / 16 }
                ]
            }),
            yellowRightEye: createModelMatrix({
                translate: [-0.38, 0.06, 1.01],
                scale: [0.84, 0.84, 1],
                rotate: [
                    { axis: "y", angle: Math.PI / -16 }
                ]
            }),
            yellowLeftEye: createModelMatrix({
                translate: [0.38, 0.06, 1.01],
                scale: [0.84, 0.84, 1],
                rotate: [
                    { axis: "y", angle: Math.PI / 16 }
                ]
            }),
            innerWhiteRightEye: createModelMatrix({
                translate: [-0.347, 0.068, 1.02],
                scale: [0.55, 0.55, 1],
                rotate: [
                    { axis: "y", angle: Math.PI / -16 }
                ]
            }),
            innerWhiteLeftEye: createModelMatrix({
                translate: [0.347, 0.068, 1.02],
                scale: [0.55, 0.55, 1],
                rotate: [
                    { axis: "y", angle: Math.PI / 16 }
                ]
            }),


            //ARMS
            //  UPPER ARMS
            upperRightArmOffset: createModelMatrix({
                translate: [-1, 0, 0],
                rotate: [
                    { axis: "z", angle: Math.PI / 2 }
                ]
            }),
            upperLeftArmOffset: createModelMatrix({
                translate: [1, 0, 0],
                rotate: [
                    { axis: "z", angle: Math.PI / 2 }
                ]
            }),

            //  ELBOW
            elbowOffset: createModelMatrix({
                translate: [0, 0, 0],
            }),

            //  LOWER ARMS
            lowerRightArmOffset: createModelMatrix({
                translate: [-0.8, 0, 0],
                rotate: [
                    { axis: "z", angle: Math.PI / 2 }
                ]
            }),
            lowerLeftArmOffset: createModelMatrix({
                translate: [0.8, 0, 0],
                rotate: [
                    { axis: "z", angle: Math.PI / 2 }
                ]
            }),

            //  HANDS
            rightFingersOffset: createModelMatrix({
                translate: [-0.2, 0, 0],
            }),
            leftFingersOffset: createModelMatrix({
                translate: [0.2, 0, 0],
            }),

            rightThumbsOffset: createModelMatrix({
                translate: [0, 0, 0],
                rotate: [
                    { axis: "z", angle: Math.PI / -3 }
                ]
            }),
            leftThumbsOffset: createModelMatrix({
                translate: [0, 0, 0],
                rotate: [
                    { axis: "z", angle: Math.PI / 3 }
                ]
            }),

            rightHandOffset: createModelMatrix({
                translate: [0, 0, 0],
            }),
            leftHandOffset: createModelMatrix({
                translate: [0, 0, 0],
            }),




            //LOWER
            rightBlackClothesOffset: createModelMatrix({
                translate: [-2.1, 1.2, 0],
                rotate: [
                    { axis: "y", angle: Math.PI / 2 },
                    { axis: "x", angle: Math.PI / 5 },
                ]
            }),
            leftBlackClothesOffset: createModelMatrix({
                translate: [2.1, 1.2, 0],
                rotate: [
                    { axis: "y", angle: Math.PI / -2 },
                    { axis: "x", angle: Math.PI / 5 },
                ]
            }),
            backBlackClothesOffset: createModelMatrix({
                translate: [0, -0.1, -1.1],
                rotate: [
                    { axis: "x", angle: Math.PI / 16 },

                ]
            }),



            //ACCESSORIES
            redBellyOffset: createModelMatrix({
                translate: [0, 0.35, 2]
            }),
            leftYellowBellyOffset: createModelMatrix({
                translate: [-1.5, 0.3, 1.4]
            }),
            rightYellowBellyOffset: createModelMatrix({
                translate: [1.5, 0.3, 1.4]
            }),


            //LEGS
            blueLeftUpperLegOffset: createModelMatrix({
                translate: [0, -0.4, 0]
            }),
            blueRightUpperLegOffset: createModelMatrix({
                translate: [0, -0.4, 0]
            }),

            blueLeftLowerLegOffset: createModelMatrix({
                translate: [0, 0, 0]
            }),
            blueRightLowerLegOffset: createModelMatrix({
                translate: [0, 0, 0]
            }),


            blackLeftShoesOffset: createModelMatrix({
                translate: [0, 0, 0.05]
            }),
            blackRightShoesOffset: createModelMatrix({
                translate: [0, 0, 0.05]
            }),

            iceLeftShoesOffset: createModelMatrix({
                translate: [0, 0.12, 0.9]
            }),
            iceRightShoesOffset: createModelMatrix({
                translate: [0, 0.12, 0.9]
            }),


            leftShoeConnect: createModelMatrix({
                translate: [0, -0.02, 0.4],
                rotate: [
                    { axis: "x", angle: Math.PI / 2.3 }
                ]
            }),
            rightShoeConnect: createModelMatrix({
                translate: [0, -0.02, 0.4],
                rotate: [
                    { axis: "x", angle: Math.PI / 2.3 }
                ]
            }),


            leftShoePad: createModelMatrix({
                translate: [0, -0.25, 0.5]
            }),
            rightShoePad: createModelMatrix({
                translate: [0, -0.25, 0.5]
            }),

            staffOffset: createModelMatrix({
                translate: [0, 0, 0],
                rotate: [
                    {
                        axis: "y", angle: Math.PI / 2
                    }
                ]
            }),
        }

        const rawStaffMesh = this.meshes.staff.solid.mesh
        recenterMesh(rawStaffMesh)
        this.meshes.staff.solid.buffers = MeshUtils.createMeshBuffers(GL, rawStaffMesh, attribs);

        this.skeleton = {
            hip: this.createBone("hip", null, { translate: [0, 1.1, 0] }),
            neck: this.createBone("neck", "hip", { translate: [0, 2.5, 0] }),
            head: this.createBone("head", "neck", { translate: [0, 0.7, 0] }),

            rightShoulder: this.createBone("rightShoulder", "neck", { translate: [-1.05, -0.2, 0] }),
            leftShoulder: this.createBone("leftShoulder", "neck", { translate: [1.05, -0.2, 0] }),

            rightElbow: this.createBone("rightElbow", "rightShoulder", { translate: [-1.8, 0, 0] }),
            leftElbow: this.createBone("leftElbow", "leftShoulder", { translate: [1.8, 0, 0] }),



            rightHand: this.createBone("rightHand", "rightElbow", { translate: [-1.8, 0, 0] }),
            leftHand: this.createBone("leftHand", "leftElbow", { translate: [1.8, 0, 0] }),

            rightFinger: this.createBone("rightFinger", "rightHand", { translate: [-0.2, 0, 0] }),
            leftFinger: this.createBone("leftFinger", "leftHand", { translate: [0.2, 0, 0] }),

            rightThumb: this.createBone("rightThumb", "rightHand", { translate: [0, 0.3, 0] }),
            leftThumb: this.createBone("leftThumb", "leftHand", { translate: [0, 0.3, 0] }),



            lowerHip: this.createBone("lowerHip", "hip", { translate: [0, -1.8, -0.2] }),

            upperLeftLeg: this.createBone("upperLeftLeg", "lowerHip", { translate: [1.25, 0, 0] }),
            upperRightLeg: this.createBone("upperRightLeg", "lowerHip", { translate: [-1.25, 0, 0] }),

            leftKnee: this.createBone("leftKnee", "upperLeftLeg", { translate: [0, -1.25, 0] }),
            rightKnee: this.createBone("rightKnee", "upperRightLeg", { translate: [0, -1.25, 0] }),

            rightShoes: this.createBone("rightShoes", "rightKnee", { translate: [0, -0.4, 0] }),
            leftShoes: this.createBone("leftShoes", "leftKnee", { translate: [0, -0.4, 0] }),



        }

        this.updateWorld();
        this.baseHipPos = this.skeleton.hip.localSpec.translate.slice();
    }


    animate(time) {
        // --- Helper Functions ---
        const idleTime = time * 0.001;
        const lerp = (a, b, t) => a + (b - a) * t;
        const clamp01 = t => Math.max(0, Math.min(1, t));
        const easeInOutQuad = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        // --- Durations ---
        const PHASE_1_DURATION = 2.0;
        const TRANSITION_1_2_DURATION = 0.5;
        const PHASE_2_DURATION = 3.0;
        const TRANSITION_2_3_DURATION = 1.5;
        const PHASE_3_DURATION = 2.0;
        const TRANSITION_3_4_DURATION = 0.5;
        const PHASE_4_DURATION = 3.0;
        const TRANSITION_4_5_DURATION = 1.5;
        const PHASE_5_DURATION = 4.0;
        const TRANSITION_5_1_DURATION = 1.0;

        // const PHASE_1_DURATION = 0;       // Jalan maju
        // const TRANSITION_1_2_DURATION = 0;
        // const PHASE_2_DURATION = 0;       // Diam (pose A)
        // const TRANSITION_2_3_DURATION = 0;
        // const PHASE_3_DURATION = 0;       // Jalan mundur
        // const TRANSITION_3_4_DURATION = 0;
        // const PHASE_4_DURATION = 0;       // Diam (pose B - sesuai permintaan)
        // const TRANSITION_4_5_DURATION = 0; // Transisi ke pose serangan
        // const PHASE_5_DURATION = 4.0;       // Serangan (Smash + Tekan Perut)
        // const TRANSITION_5_1_DURATION = 1.0; // Transisi kembali ke awal (jalan)

        // --- Timeline (FIXED) ---
        // Penjadwalan yang benar, satu per satu
        const START_PHASE_1 = 0.0;
        const END_PHASE_1 = START_PHASE_1 + PHASE_1_DURATION; // 2.0
        const START_TRANSITION_1_2 = END_PHASE_1;
        const END_TRANSITION_1_2 = START_TRANSITION_1_2 + TRANSITION_1_2_DURATION; // 2.5
        const START_PHASE_2 = END_TRANSITION_1_2;
        const END_PHASE_2 = START_PHASE_2 + PHASE_2_DURATION; // 5.5
        const START_TRANSITION_2_3 = END_PHASE_2;
        const END_TRANSITION_2_3 = START_TRANSITION_2_3 + TRANSITION_2_3_DURATION; // 7.0
        const START_PHASE_3 = END_TRANSITION_2_3;
        const END_PHASE_3 = START_PHASE_3 + PHASE_3_DURATION; // 9.0
        const START_TRANSITION_3_4 = END_PHASE_3;
        const END_TRANSITION_3_4 = START_TRANSITION_3_4 + TRANSITION_3_4_DURATION; // 9.5
        const START_PHASE_4 = END_TRANSITION_3_4; // <-- FIX
        const END_PHASE_4 = START_PHASE_4 + PHASE_4_DURATION; // 12.5
        const START_TRANSITION_4_5 = END_PHASE_4;
        const END_TRANSITION_4_5 = START_TRANSITION_4_5 + TRANSITION_4_5_DURATION; // 13.0
        const START_PHASE_5 = END_TRANSITION_4_5; // <-- FIX
        const END_PHASE_5 = START_PHASE_5 + PHASE_5_DURATION; // 17.0
        const START_TRANSITION_5_1 = END_PHASE_5;
        const END_TRANSITION_5_1 = START_TRANSITION_5_1 + TRANSITION_5_1_DURATION; // 18.0

        const TOTAL_CYCLE_TIME = END_TRANSITION_5_1; // <-- Total siklus adalah 18 detik

        // Waktu saat ini dalam siklus
        const timeInCycle = idleTime % TOTAL_CYCLE_TIME;

        // --- Base Values ---
        const [baseX, baseY, baseZ] = this.baseHipPos;
        const walkDistance = 4.0;

        // Pose statis tangan kanan (saat tidak dipakai)
        const rightArmStatic = {
            rightShoulder_y: Math.PI / 6,
            rightShoulder_z: Math.PI / 8,
            rightElbow_y: Math.PI / 5,
            rightFinger_y: Math.PI / 4
        };

        // Pose awal (penting untuk transisi 5_1)
        const posePhase1_Start = {
            hipYOffset: 0,
            hipZ: 0,
            upperRightLeg_x: 0,
            upperLeftLeg_x: 0,
            rightKnee_x: 0,
            leftKnee_x: 0,
            leftShoulder_x: 0,
            leftShoulder_y: 0,
            leftShoulder_z: Math.PI / -4.5,
            leftElbow_x: Math.PI / 3,
            leftElbow_y: 0,
            leftElbow_z: Math.PI / -12,
            rightShoulder_x: 0,
            rightShoulder_y: rightArmStatic.rightShoulder_y,
            rightShoulder_z: rightArmStatic.rightShoulder_z,
            rightElbow_x: 0,
            rightElbow_y: rightArmStatic.rightElbow_y,
            rightElbow_z: 0,
            head_x: 0,
            head_y: 0,
            head_z: 0,
        };

        // Inisialisasi lastPose jika belum ada
        if (!this.lastPose) {
            this.lastPose = posePhase1_Start;
        }

        // Fungsi bantu untuk set rotasi (agar lebih rapi)
        const setRotation = (bone, x, y, z) => {
            bone.setLocalSpec({
                rotate: [
                    { axis: 'x', angle: x },
                    { axis: 'y', angle: y },
                    { axis: 'z', angle: z }
                ]
            });
        };

        // Fungsi bantu untuk set rotasi tangan kanan statis
        const setRightArmStatic = () => {
            setRotation(
                this.skeleton.rightShoulder,
                0,
                rightArmStatic.rightShoulder_y,
                rightArmStatic.rightShoulder_z
            );
            setRotation(
                this.skeleton.rightElbow,
                0,
                rightArmStatic.rightElbow_y,
                0
            );
            setLocalRotationAxisAngle(this.skeleton.rightFinger, 'y', rightArmStatic.rightFinger_y);
        };

        // =================================================================
        // PHASE 1: JALAN MAJU (2.0 detik)
        // =================================================================
        if (timeInCycle < END_PHASE_1) {
            const phaseTime = timeInCycle - START_PHASE_1;
            const t = phaseTime / PHASE_1_DURATION;

            const walkCycleSpeed = 6.0;
            const swing = Math.sin(phaseTime * walkCycleSpeed);
            const bodyBob = Math.abs(swing) * -0.2;
            const currentZPos = lerp(0, walkDistance, t);

            const legSwingAmount = 0.7;
            const kneeBendAmount = 1.0;
            const rightLegX = swing * legSwingAmount;
            const leftLegX = -swing * legSwingAmount;
            const rightKneeX = Math.max(0, rightLegX / legSwingAmount) * kneeBendAmount;
            const leftKneeX = Math.max(0, leftLegX / legSwingAmount) * kneeBendAmount;

            // Apply pose
            this.skeleton.hip.setLocalSpec({ translate: [baseX, baseY + bodyBob, baseZ + currentZPos] });
            setLocalRotationAxisAngle(this.skeleton.upperRightLeg, 'x', rightLegX);
            setLocalRotationAxisAngle(this.skeleton.upperLeftLeg, 'x', leftLegX);
            setLocalRotationAxisAngle(this.skeleton.rightKnee, 'x', rightKneeX);
            setLocalRotationAxisAngle(this.skeleton.leftKnee, 'x', leftKneeX);

            setRightArmStatic();

            const leftShoulderZ = Math.PI / -4.5;
            const leftElbowX = Math.PI / 3;
            const leftElbowZ = Math.PI / -12;
            setRotation(this.skeleton.leftShoulder, 0, 0, leftShoulderZ);
            setRotation(this.skeleton.leftElbow, leftElbowX, 0, leftElbowZ);

            const headLookSpeed = 2.0;
            const headLookAmountY = Math.PI / 8; // Max rotasi kiri/kanan
            const headLookAmountZ = Math.PI / 40; // Sedikit tilt
            const headY = Math.sin(phaseTime * headLookSpeed) * headLookAmountY;
            const headZ = Math.sin(phaseTime * headLookSpeed * 0.7) * headLookAmountZ; // Tilt sedikit beda frekuensi
            this.skeleton.head.setLocalSpec({
                rotate: [
                    { axis: 'y', angle: headY },
                    { axis: 'z', angle: headZ }
                ]
            });

            // Simpan pose akhir
            this.lastPose = {
                hipYOffset: bodyBob,
                hipZ: currentZPos,
                upperRightLeg_x: rightLegX,
                upperLeftLeg_x: leftLegX,
                rightKnee_x: rightKneeX,
                leftKnee_x: leftKneeX,
                leftShoulder_x: 0,
                leftShoulder_y: 0,
                leftShoulder_z: leftShoulderZ,
                leftElbow_x: leftElbowX,
                leftElbow_y: 0,
                leftElbow_z: leftElbowZ,
                rightShoulder_x: 0,
                rightShoulder_y: rightArmStatic.rightShoulder_y,
                rightShoulder_z: rightArmStatic.rightShoulder_z,
                rightElbow_x: 0,
                rightElbow_y: rightArmStatic.rightElbow_y,
                rightElbow_z: 0,
                head_x: 0,
                head_y: headY,
                head_z: headZ,
            };
        }

        // =================================================================
        // TRANSISI 1 -> 2: Berhenti jalan, siap diam (0.5 detik)
        // =================================================================
        else if (timeInCycle < END_TRANSITION_1_2) {
            const phaseTime = timeInCycle - START_PHASE_2;
            const transitionTime = timeInCycle - START_TRANSITION_1_2;
            const t = easeInOutQuad(clamp01(transitionTime / TRANSITION_1_2_DURATION));

            const posePrev = this.lastPose;
            const poseNext = { // Pose awal Phase 2
                hipYOffset: 0,
                hipZ: walkDistance,
                upperRightLeg_x: 0,
                upperLeftLeg_x: 0,
                rightKnee_x: 0,
                leftKnee_x: 0,
                leftShoulder_x: Math.PI / 16,
                leftShoulder_y: Math.PI / -32,
                leftShoulder_z: Math.PI / 6,
                leftElbow_x: 0,
                leftElbow_y: 0,
                leftElbow_z: Math.sin(0) * 0.1 + Math.PI / 4, // Awal wave
                rightShoulder_x: 0,
                rightShoulder_y: rightArmStatic.rightShoulder_y,
                rightShoulder_z: rightArmStatic.rightShoulder_z,
                rightElbow_x: 0,
                rightElbow_y: rightArmStatic.rightElbow_y,
                rightElbow_z: 0
            };

            const hipYOffset = lerp(posePrev.hipYOffset, poseNext.hipYOffset, t);
            const hipZ = lerp(posePrev.hipZ, poseNext.hipZ, t);
            this.skeleton.hip.setLocalSpec({ translate: [baseX, baseY + hipYOffset, baseZ + hipZ] });

            setLocalRotationAxisAngle(this.skeleton.upperRightLeg, 'x', lerp(posePrev.upperRightLeg_x, poseNext.upperRightLeg_x, t));
            setLocalRotationAxisAngle(this.skeleton.upperLeftLeg, 'x', lerp(posePrev.upperLeftLeg_x, poseNext.upperLeftLeg_x, t));
            setLocalRotationAxisAngle(this.skeleton.rightKnee, 'x', lerp(posePrev.rightKnee_x, poseNext.rightKnee_x, t));
            setLocalRotationAxisAngle(this.skeleton.leftKnee, 'x', lerp(posePrev.leftKnee_x, poseNext.leftKnee_x, t));

            setRotation(this.skeleton.leftShoulder,
                lerp(posePrev.leftShoulder_x, poseNext.leftShoulder_x, t),
                lerp(posePrev.leftShoulder_y, poseNext.leftShoulder_y, t),
                lerp(posePrev.leftShoulder_z, poseNext.leftShoulder_z, t)
            );
            setRotation(this.skeleton.leftElbow,
                lerp(posePrev.leftElbow_x, poseNext.leftElbow_x, t),
                lerp(posePrev.leftElbow_y, poseNext.leftElbow_y, t),
                lerp(posePrev.leftElbow_z, poseNext.leftElbow_z, t)
            );

            setRightArmStatic(); // Tangan kanan tetap

            const headLookSpeedIdle = 1.5;
            const headLookAmountYIdle = Math.PI / 10; // Sedikit lebih sempit
            const headLookAmountZIdle = Math.PI / 50;
            const headY = Math.sin(phaseTime * headLookSpeedIdle) * headLookAmountYIdle;
            const headZ = Math.sin(phaseTime * headLookSpeedIdle * 0.8) * headLookAmountZIdle;
            this.skeleton.head.setLocalSpec({
                rotate: [
                    { axis: 'y', angle: headY },
                    { axis: 'z', angle: headZ }
                ]
            });


            // Simpan pose akhir (akan sama dengan poseNext saat t=1)
            this.lastPose = {
                hipYOffset: hipYOffset,
                hipZ: hipZ,
                upperRightLeg_x: lerp(posePrev.upperRightLeg_x, poseNext.upperRightLeg_x, t),
                upperLeftLeg_x: lerp(posePrev.upperLeftLeg_x, poseNext.upperLeftLeg_x, t),
                rightKnee_x: lerp(posePrev.rightKnee_x, poseNext.rightKnee_x, t),
                leftKnee_x: lerp(posePrev.leftKnee_x, poseNext.leftKnee_x, t),
                leftShoulder_x: lerp(posePrev.leftShoulder_x, poseNext.leftShoulder_x, t),
                leftShoulder_y: lerp(posePrev.leftShoulder_y, poseNext.leftShoulder_y, t),
                leftShoulder_z: lerp(posePrev.leftShoulder_z, poseNext.leftShoulder_z, t),
                leftElbow_x: lerp(posePrev.leftElbow_x, poseNext.leftElbow_x, t),
                leftElbow_y: lerp(posePrev.leftElbow_y, poseNext.leftElbow_y, t),
                leftElbow_z: lerp(posePrev.leftElbow_z, poseNext.leftElbow_z, t),
                rightShoulder_x: 0,
                rightShoulder_y: rightArmStatic.rightShoulder_y,
                rightShoulder_z: rightArmStatic.rightShoulder_z,
                rightElbow_x: 0,
                rightElbow_y: rightArmStatic.rightElbow_y,
                rightElbow_z: 0,
                head_x: 0,
                head_y: headY,
                head_z: headZ
            };
        }

        // =================================================================
        // PHASE 2: DIAM (POSE A) (3.0 detik)
        // =================================================================
        else if (timeInCycle < END_PHASE_2) {
            const phaseTime = timeInCycle - START_PHASE_2;

            // Goyang sedikit siku kiri
            const wave = Math.sin(phaseTime * 5) * 0.1;
            const leftShoulderX = Math.PI / 16;
            const leftShoulderY = Math.PI / -32;
            const leftShoulderZ = Math.PI / 6;
            const leftElbowX = 0;
            const leftElbowZ = wave + Math.PI / 4;

            // Apply pose
            this.skeleton.hip.setLocalSpec({ translate: [baseX, baseY, baseZ + walkDistance] });
            setLocalRotationAxisAngle(this.skeleton.upperRightLeg, 'x', 0);
            setLocalRotationAxisAngle(this.skeleton.upperLeftLeg, 'x', 0);
            setLocalRotationAxisAngle(this.skeleton.rightKnee, 'x', 0);
            setLocalRotationAxisAngle(this.skeleton.leftKnee, 'x', 0);

            setRightArmStatic();

            setRotation(this.skeleton.leftShoulder, leftShoulderX, leftShoulderY, leftShoulderZ);
            setRotation(this.skeleton.leftElbow, leftElbowX, 0, leftElbowZ);

            // Simpan pose akhir
            this.lastPose = {
                hipYOffset: 0,
                hipZ: walkDistance,
                upperRightLeg_x: 0,
                upperLeftLeg_x: 0,
                rightKnee_x: 0,
                leftKnee_x: 0,
                leftShoulder_x: leftShoulderX,
                leftShoulder_y: leftShoulderY,
                leftShoulder_z: leftShoulderZ,
                leftElbow_x: leftElbowX,
                leftElbow_y: 0,
                leftElbow_z: leftElbowZ,
                rightShoulder_x: 0,
                rightShoulder_y: rightArmStatic.rightShoulder_y,
                rightShoulder_z: rightArmStatic.rightShoulder_z,
                rightElbow_x: 0,
                rightElbow_y: rightArmStatic.rightElbow_y,
                rightElbow_z: 0
            };
        }

        // =================================================================
        // TRANSISI 2 -> 3: Siap jalan mundur (1.5 detik)
        // =================================================================
        else if (timeInCycle < END_TRANSITION_2_3) {
            const transitionTime = timeInCycle - START_TRANSITION_2_3;
            const t = easeInOutQuad(clamp01(transitionTime / TRANSITION_2_3_DURATION));

            const posePrev = this.lastPose;
            const poseNext = { // Pose awal Phase 3
                hipYOffset: 0, // Akan di-override oleh body bob
                hipZ: walkDistance, // Akan di-override oleh Z pos
                upperRightLeg_x: 0,
                upperLeftLeg_x: 0,
                rightKnee_x: 0,
                leftKnee_x: 0,
                leftShoulder_x: 0,
                leftShoulder_y: 0,
                leftShoulder_z: Math.PI / -4.5,
                leftElbow_x: Math.PI / 3,
                leftElbow_y: 0,
                leftElbow_z: Math.PI / -12,
                rightShoulder_x: 0,
                rightShoulder_y: rightArmStatic.rightShoulder_y,
                rightShoulder_z: rightArmStatic.rightShoulder_z,
                rightElbow_x: 0,
                rightElbow_y: rightArmStatic.rightElbow_y,
                rightElbow_z: 0
            };

            const hipYOffset = lerp(posePrev.hipYOffset, poseNext.hipYOffset, t);
            const hipZ = lerp(posePrev.hipZ, poseNext.hipZ, t);
            this.skeleton.hip.setLocalSpec({ translate: [baseX, baseY + hipYOffset, baseZ + hipZ] });


            setLocalRotationAxisAngle(this.skeleton.upperRightLeg, 'x', lerp(posePrev.upperRightLeg_x, poseNext.upperRightLeg_x, t));
            setLocalRotationAxisAngle(this.skeleton.upperLeftLeg, 'x', lerp(posePrev.upperLeftLeg_x, poseNext.upperLeftLeg_x, t));
            setLocalRotationAxisAngle(this.skeleton.rightKnee, 'x', lerp(posePrev.rightKnee_x, poseNext.rightKnee_x, t));
            setLocalRotationAxisAngle(this.skeleton.leftKnee, 'x', lerp(posePrev.leftKnee_x, poseNext.leftKnee_x, t));

            setRotation(this.skeleton.leftShoulder,
                lerp(posePrev.leftShoulder_x, poseNext.leftShoulder_x, t),
                lerp(posePrev.leftShoulder_y, poseNext.leftShoulder_y, t),
                lerp(posePrev.leftShoulder_z, poseNext.leftShoulder_z, t)
            );
            setRotation(this.skeleton.leftElbow,
                lerp(posePrev.leftElbow_x, poseNext.leftElbow_x, t),
                lerp(posePrev.leftElbow_y, poseNext.leftElbow_y, t),
                lerp(posePrev.leftElbow_z, poseNext.leftElbow_z, t)
            );

            setRightArmStatic();

            // Simpan pose akhir
            this.lastPose = {
                hipYOffset: hipYOffset,
                hipZ: hipZ,
                upperRightLeg_x: lerp(posePrev.upperRightLeg_x, poseNext.upperRightLeg_x, t),
                upperLeftLeg_x: lerp(posePrev.upperLeftLeg_x, poseNext.upperLeftLeg_x, t),
                rightKnee_x: lerp(posePrev.rightKnee_x, poseNext.rightKnee_x, t),
                leftKnee_x: lerp(posePrev.leftKnee_x, poseNext.leftKnee_x, t),
                leftShoulder_x: lerp(posePrev.leftShoulder_x, poseNext.leftShoulder_x, t),
                leftShoulder_y: lerp(posePrev.leftShoulder_y, poseNext.leftShoulder_y, t),
                leftShoulder_z: lerp(posePrev.leftShoulder_z, poseNext.leftShoulder_z, t),
                leftElbow_x: lerp(posePrev.leftElbow_x, poseNext.leftElbow_x, t),
                leftElbow_y: lerp(posePrev.leftElbow_y, poseNext.leftElbow_y, t),
                leftElbow_z: lerp(posePrev.leftElbow_z, poseNext.leftElbow_z, t),
                rightShoulder_x: 0,
                rightShoulder_y: rightArmStatic.rightShoulder_y,
                rightShoulder_z: rightArmStatic.rightShoulder_z,
                rightElbow_x: 0,
                rightElbow_y: rightArmStatic.rightElbow_y,
                rightElbow_z: 0
            };
        }

        // =================================================================
        // PHASE 3: JALAN MUNDUR (2.0 detik)
        // =================================================================
        else if (timeInCycle < END_PHASE_3) {
            const phaseTime = timeInCycle - START_PHASE_3;
            const t = phaseTime / PHASE_3_DURATION;

            const walkCycleSpeed = 6.0;
            const swing = Math.sin(phaseTime * walkCycleSpeed);
            const bodyBob = Math.abs(swing) * -0.2;

            const startZ = walkDistance;
            const targetZ = 0;
            const currentZPos = lerp(startZ, targetZ, t); // Mundur

            const legSwingAmount = 0.7;
            const kneeBendAmount = 1.0;
            const rightLegX = swing * legSwingAmount;
            const leftLegX = -swing * legSwingAmount;
            const rightKneeX = Math.max(0, rightLegX / legSwingAmount) * kneeBendAmount;
            const leftKneeX = Math.max(0, leftLegX / legSwingAmount) * kneeBendAmount;

            // Apply pose
            this.skeleton.hip.setLocalSpec({ translate: [baseX, baseY + bodyBob, baseZ + currentZPos] });
            setLocalRotationAxisAngle(this.skeleton.upperRightLeg, 'x', rightLegX);
            setLocalRotationAxisAngle(this.skeleton.upperLeftLeg, 'x', leftLegX);
            setLocalRotationAxisAngle(this.skeleton.rightKnee, 'x', rightKneeX);
            setLocalRotationAxisAngle(this.skeleton.leftKnee, 'x', leftKneeX);

            setRightArmStatic();

            const leftShoulderZ = Math.PI / -4.5;
            const leftElbowX = Math.PI / 3;
            const leftElbowZ = Math.PI / -12;
            setRotation(this.skeleton.leftShoulder, 0, 0, leftShoulderZ);
            setRotation(this.skeleton.leftElbow, leftElbowX, 0, leftElbowZ);

            // Simpan pose akhir
            this.lastPose = {
                hipYOffset: bodyBob,
                hipZ: currentZPos,
                upperRightLeg_x: rightLegX,
                upperLeftLeg_x: leftLegX,
                rightKnee_x: rightKneeX,
                leftKnee_x: leftKneeX,
                leftShoulder_x: 0,
                leftShoulder_y: 0,
                leftShoulder_z: leftShoulderZ,
                leftElbow_x: leftElbowX,
                leftElbow_y: 0,
                leftElbow_z: leftElbowZ,
                rightShoulder_x: 0,
                rightShoulder_y: rightArmStatic.rightShoulder_y,
                rightShoulder_z: rightArmStatic.rightShoulder_z,
                rightElbow_x: 0,
                rightElbow_y: rightArmStatic.rightElbow_y,
                rightElbow_z: 0
            };
        }

        // =================================================================
        // TRANSISI 3 -> 4: Berhenti jalan mundur, siap diam (0.5 detik)
        // =================================================================
        else if (timeInCycle < END_TRANSITION_3_4) {
            const transitionTime = timeInCycle - START_TRANSITION_3_4;
            const t = easeInOutQuad(clamp01(transitionTime / TRANSITION_3_4_DURATION));

            const posePrev = this.lastPose;
            const poseNext = { // Pose awal Phase 4
                hipYOffset: 0,
                hipZ: 0,
                upperRightLeg_x: 0,
                upperLeftLeg_x: 0,
                rightKnee_x: 0,
                leftKnee_x: 0,
                leftShoulder_x: Math.PI / 16, // Sama seperti pose 2
                leftShoulder_y: Math.PI / -32,
                leftShoulder_z: Math.PI / 6,
                leftElbow_x: 0,
                leftElbow_y: 0,
                leftElbow_z: Math.sin(0) * 0.1 + Math.PI / 4, // Awal wave
                rightShoulder_x: 0,
                rightShoulder_y: rightArmStatic.rightShoulder_y,
                rightShoulder_z: rightArmStatic.rightShoulder_z,
                rightElbow_x: 0,
                rightElbow_y: rightArmStatic.rightElbow_y,
                rightElbow_z: 0
            };

            const hipYOffset = lerp(posePrev.hipYOffset, poseNext.hipYOffset, t);
            const hipZ = lerp(posePrev.hipZ, poseNext.hipZ, t);
            this.skeleton.hip.setLocalSpec({ translate: [baseX, baseY + hipYOffset, baseZ + hipZ] });

            setLocalRotationAxisAngle(this.skeleton.upperRightLeg, 'x', lerp(posePrev.upperRightLeg_x, poseNext.upperRightLeg_x, t));
            setLocalRotationAxisAngle(this.skeleton.upperLeftLeg, 'x', lerp(posePrev.upperLeftLeg_x, poseNext.upperLeftLeg_x, t));
            setLocalRotationAxisAngle(this.skeleton.rightKnee, 'x', lerp(posePrev.rightKnee_x, poseNext.rightKnee_x, t));
            setLocalRotationAxisAngle(this.skeleton.leftKnee, 'x', lerp(posePrev.leftKnee_x, poseNext.leftKnee_x, t));

            setRotation(this.skeleton.leftShoulder,
                lerp(posePrev.leftShoulder_x, poseNext.leftShoulder_x, t),
                lerp(posePrev.leftShoulder_y, poseNext.leftShoulder_y, t),
                lerp(posePrev.leftShoulder_z, poseNext.leftShoulder_z, t)
            );
            setRotation(this.skeleton.leftElbow,
                lerp(posePrev.leftElbow_x, poseNext.leftElbow_x, t),
                lerp(posePrev.leftElbow_y, poseNext.leftElbow_y, t),
                lerp(posePrev.leftElbow_z, poseNext.leftElbow_z, t)
            );

            setRightArmStatic();

            // Simpan pose akhir
            this.lastPose = {
                hipYOffset: hipYOffset,
                hipZ: hipZ,
                upperRightLeg_x: lerp(posePrev.upperRightLeg_x, poseNext.upperRightLeg_x, t),
                upperLeftLeg_x: lerp(posePrev.upperLeftLeg_x, poseNext.upperLeftLeg_x, t),
                rightKnee_x: lerp(posePrev.rightKnee_x, poseNext.rightKnee_x, t),
                leftKnee_x: lerp(posePrev.leftKnee_x, poseNext.leftKnee_x, t),
                leftShoulder_x: lerp(posePrev.leftShoulder_x, poseNext.leftShoulder_x, t),
                leftShoulder_y: lerp(posePrev.leftShoulder_y, poseNext.leftShoulder_y, t),
                leftShoulder_z: lerp(posePrev.leftShoulder_z, poseNext.leftShoulder_z, t),
                leftElbow_x: lerp(posePrev.leftElbow_x, poseNext.leftElbow_x, t),
                leftElbow_y: lerp(posePrev.leftElbow_y, poseNext.leftElbow_y, t),
                leftElbow_z: lerp(posePrev.leftElbow_z, poseNext.leftElbow_z, t),
                rightShoulder_x: 0,
                rightShoulder_y: rightArmStatic.rightShoulder_y,
                rightShoulder_z: rightArmStatic.rightShoulder_z,
                rightElbow_x: 0,
                rightElbow_y: rightArmStatic.rightElbow_y,
                rightElbow_z: 0
            };
        }

        // =================================================================
        // PHASE 4: DIAM (POSE B - SAMA SEPERTI FASE 2) (3.0 detik)
        // =================================================================
        else if (timeInCycle < END_PHASE_4) {
            const phaseTime = timeInCycle - START_PHASE_4;

            // Goyang sedikit siku kiri
            const wave = Math.sin(phaseTime * 5) * 0.1;
            const leftShoulderX = Math.PI / 16;
            const leftShoulderY = Math.PI / -32;
            const leftShoulderZ = Math.PI / 6;
            const leftElbowX = 0;
            const leftElbowZ = wave + Math.PI / 4;

            // Apply pose (posisi di Z=0)
            this.skeleton.hip.setLocalSpec({ translate: [baseX, baseY, baseZ + 0] });
            setLocalRotationAxisAngle(this.skeleton.upperRightLeg, 'x', 0);
            setLocalRotationAxisAngle(this.skeleton.upperLeftLeg, 'x', 0);
            setLocalRotationAxisAngle(this.skeleton.rightKnee, 'x', 0);
            setLocalRotationAxisAngle(this.skeleton.leftKnee, 'x', 0);



            setRightArmStatic();

            setRotation(this.skeleton.leftShoulder, leftShoulderX, leftShoulderY, leftShoulderZ);
            setRotation(this.skeleton.leftElbow, leftElbowX, 0, leftElbowZ);

            // Simpan pose akhir
            this.lastPose = {
                hipYOffset: 0,
                hipZ: 0,
                upperRightLeg_x: 0,
                upperLeftLeg_x: 0,
                rightKnee_x: 0,
                leftKnee_x: 0,
                leftShoulder_x: leftShoulderX,
                leftShoulder_y: leftShoulderY,
                leftShoulder_z: leftShoulderZ,
                leftElbow_x: leftElbowX,
                leftElbow_y: 0,
                leftElbow_z: leftElbowZ,
                rightShoulder_x: 0,
                rightShoulder_y: rightArmStatic.rightShoulder_y,
                rightShoulder_z: rightArmStatic.rightShoulder_z,
                rightElbow_x: 0,
                rightElbow_y: rightArmStatic.rightElbow_y,
                rightElbow_z: 0
            };
        }

        // =================================================================
        // TRANSISI 4 -> 5: Siap smash (0.5 detik)
        // =================================================================
        else if (timeInCycle < END_TRANSITION_4_5) {
            const transitionTime = timeInCycle - START_TRANSITION_4_5;
            const t = easeInOutQuad(clamp01(transitionTime / TRANSITION_4_5_DURATION));

            const posePrev = this.lastPose;
            const poseNext = { // Pose awal Phase 5 (tangan kanan siap di atas)
                hipYOffset: 0,
                hipZ: 0.1, // Sedikit maju
                upperRightLeg_x: 0,
                upperLeftLeg_x: 0,
                rightKnee_x: 0,
                leftKnee_x: 0,
                leftShoulder_x: 0, // Tangan kiri kembali ke pose normal
                leftShoulder_y: 0,
                leftShoulder_z: Math.PI / -4.5,
                leftElbow_x: Math.PI / 3,
                leftElbow_y: 0,
                leftElbow_z: Math.PI / -12,
                rightShoulder_x: -Math.PI * 0.8, // Tangan kanan diangkat tinggi
                rightShoulder_y: rightArmStatic.rightShoulder_y,
                rightShoulder_z: rightArmStatic.rightShoulder_z,
                rightElbow_x: Math.PI * 0.5, // Siku menekuk
                rightElbow_y: rightArmStatic.rightElbow_y,
                rightElbow_z: 0
            };

            const hipYOffset = lerp(posePrev.hipYOffset, poseNext.hipYOffset, t);
            const hipZ = lerp(posePrev.hipZ, poseNext.hipZ, t);
            this.skeleton.hip.setLocalSpec({ translate: [baseX, baseY + hipYOffset, baseZ + hipZ] });

            // Kaki tetap
            setLocalRotationAxisAngle(this.skeleton.upperRightLeg, 'x', lerp(posePrev.upperRightLeg_x, poseNext.upperRightLeg_x, t));
            setLocalRotationAxisAngle(this.skeleton.upperLeftLeg, 'x', lerp(posePrev.upperLeftLeg_x, poseNext.upperLeftLeg_x, t));

            // Transisi tangan kiri
            setRotation(this.skeleton.leftShoulder,
                lerp(posePrev.leftShoulder_x, poseNext.leftShoulder_x, t),
                lerp(posePrev.leftShoulder_y, poseNext.leftShoulder_y, t),
                lerp(posePrev.leftShoulder_z, poseNext.leftShoulder_z, t)
            );
            setRotation(this.skeleton.leftElbow,
                lerp(posePrev.leftElbow_x, poseNext.leftElbow_x, t),
                lerp(posePrev.leftElbow_y, poseNext.leftElbow_y, t),
                lerp(posePrev.leftElbow_z, poseNext.leftElbow_z, t)
            );

            // Transisi tangan kanan
            setRotation(this.skeleton.rightShoulder,
                lerp(posePrev.rightShoulder_x, poseNext.rightShoulder_x, t),
                lerp(posePrev.rightShoulder_y, poseNext.rightShoulder_y, t),
                lerp(posePrev.rightShoulder_z, poseNext.rightShoulder_z, t)
            );
            setRotation(this.skeleton.rightElbow,
                lerp(posePrev.rightElbow_x, poseNext.rightElbow_x, t),
                lerp(posePrev.rightElbow_y, poseNext.rightElbow_y, t),
                lerp(posePrev.rightElbow_z, poseNext.rightElbow_z, t)
            );

            // Simpan pose akhir
            this.lastPose = {
                hipYOffset: hipYOffset,
                hipZ: hipZ,
                upperRightLeg_x: lerp(posePrev.upperRightLeg_x, poseNext.upperRightLeg_x, t),
                upperLeftLeg_x: lerp(posePrev.upperLeftLeg_x, poseNext.upperLeftLeg_x, t),
                rightKnee_x: lerp(posePrev.rightKnee_x, poseNext.rightKnee_x, t),
                leftKnee_x: lerp(posePrev.leftKnee_x, poseNext.leftKnee_x, t),
                leftShoulder_x: lerp(posePrev.leftShoulder_x, poseNext.leftShoulder_x, t),
                leftShoulder_y: lerp(posePrev.leftShoulder_y, poseNext.leftShoulder_y, t),
                leftShoulder_z: lerp(posePrev.leftShoulder_z, poseNext.leftShoulder_z, t),
                leftElbow_x: lerp(posePrev.leftElbow_x, poseNext.leftElbow_x, t),
                leftElbow_y: lerp(posePrev.leftElbow_y, poseNext.leftElbow_y, t),
                leftElbow_z: lerp(posePrev.leftElbow_z, poseNext.leftElbow_z, t),
                rightShoulder_x: lerp(posePrev.rightShoulder_x, poseNext.rightShoulder_x, t),
                rightShoulder_y: lerp(posePrev.rightShoulder_y, poseNext.rightShoulder_y, t),
                rightShoulder_z: lerp(posePrev.rightShoulder_z, poseNext.rightShoulder_z, t),
                rightElbow_x: lerp(posePrev.rightElbow_x, poseNext.rightElbow_x, t),
                rightElbow_y: lerp(posePrev.rightElbow_y, poseNext.rightElbow_y, t),
                rightElbow_z: lerp(posePrev.rightElbow_z, poseNext.rightElbow_z, t)
            };
        }


        // =================================================================
        // PHASE 5: SERANGAN (SMASH + HONK PERUT) (4.0 detik)
        // =================================================================
        else if (timeInCycle < END_PHASE_5) {
            const phaseTime = timeInCycle - START_PHASE_5;
            const t = phaseTime / PHASE_5_DURATION;

            // --- Bagian A: Smash (t = 0.0 s/d 0.25)
            const smashDuration = 0.25;
            const pressDuration = 1.0 - smashDuration; // Sisa waktu untuk 'honk'

            let pose = {}; // Untuk menyimpan pose akhir fase ini

            if (t < smashDuration) {
                const tSmash = t / smashDuration; // Normalisasi waktu smash (0-1)
                const tEased = 1 - Math.pow(1 - tSmash, 4); // Exponential Out

                const startShoulderX = -Math.PI * 0.8;
                const endShoulderX = 0.1;
                const startElbowX = Math.PI * 0.5;
                const endElbowX = -0.1;

                const shoulderX = lerp(startShoulderX, endShoulderX, tEased);
                const elbowX = lerp(startElbowX, endElbowX, tEased);

                setRotation(this.skeleton.rightShoulder, shoulderX, rightArmStatic.rightShoulder_y, rightArmStatic.rightShoulder_z);
                setRotation(this.skeleton.rightElbow, elbowX, rightArmStatic.rightElbow_y, 0);

                // Badan sedikit membungkuk ke depan
                const hipZ = 0.1 + tEased * 0.3; // Maju saat smash
                const hipY = -tEased * 0.1; // Turun sedikit
                this.skeleton.hip.setLocalSpec({ translate: [baseX, baseY + hipY, baseZ + hipZ] });

                // Tangan kiri tetap di pose normal
                const leftShoulderZ = Math.PI / -4.5;
                const leftElbowX = Math.PI / 3;
                const leftElbowZ = Math.PI / -12;
                setRotation(this.skeleton.leftShoulder, 0, 0, leftShoulderZ);
                setRotation(this.skeleton.leftElbow, leftElbowX, 0, leftElbowZ);

                pose = {
                    hipYOffset: hipY, hipZ: hipZ,
                    leftShoulder_x: 0, leftShoulder_y: 0, leftShoulder_z: leftShoulderZ,
                    leftElbow_x: leftElbowX, leftElbow_y: 0, leftElbow_z: leftElbowZ,
                    rightShoulder_x: shoulderX, rightShoulder_y: rightArmStatic.rightShoulder_y, rightShoulder_z: rightArmStatic.rightShoulder_z,
                    rightElbow_x: elbowX, rightElbow_y: rightArmStatic.rightElbow_y, rightElbow_z: 0,
                };
            }

            else {
                const tPressNormalized = (t - smashDuration) / pressDuration; // Normalisasi 0-1

                // Tangan kanan kembali ke posisi statis setelah smash
                const tRightReturn = clamp01(tPressNormalized / 0.2); // Cepat kembali
                const smashedShoulderX = 0.1;
                const smashedElbowX = -0.1;

                const rightShoulderX = lerp(smashedShoulderX, 0, tRightReturn);
                const rightElbowX = lerp(smashedElbowX, 0, tRightReturn);
                setRotation(this.skeleton.rightShoulder, rightShoulderX, rightArmStatic.rightShoulder_y, rightArmStatic.rightShoulder_z);
                setRotation(this.skeleton.rightElbow, rightElbowX, rightArmStatic.rightElbow_y, 0);

                // Badan kembali tegak
                const startHipZ = 0.4; // Posisi akhir smash
                const startHipY = -0.1;
                const hipZ = lerp(startHipZ, 0, tRightReturn);
                const hipY = lerp(startHipY, 0, tRightReturn);
                this.skeleton.hip.setLocalSpec({ translate: [baseX, baseY + hipY, baseZ + hipZ] });

                // --- LOGIKA HONK (UNTUK TANGAN DAN PERUT) ---
                // (PERUBAHAN) Membuat 2 siklus honk (0->1->0->1->0) selama durasi tPressNormalized
                const honkIntensity = Math.abs(Math.sin(tPressNormalized * 2 * Math.PI));

                // Pose A: Tangan istirahat (dari posePhase1_Start)
                const restShoulderX = 0;
                const restShoulderY = 0;
                const restShoulderZ = Math.PI / -4.5;
                const restElbowX = Math.PI / 3;
                const restElbowZ = Math.PI / -12;

                // Pose B: Tangan menekan (Sesuai permintaan Anda)
                const honkShoulderX = -1.5; // "ke atas 0.3" (X negatif)
                const honkShoulderY = 0.5;  // "ke kanan 0.5" (Y positif)
                const honkShoulderZ = Math.PI / -4; // Z tidak diubah
                const honkElbowX = Math.PI + Math.PI / 5; // X tidak diubah
                const honkElbowZ = 1.5; // "elbow z -0.3"

                // Lerp (interpolasi) antara Pose A dan Pose B
                const leftShoulderX = lerp(restShoulderX, honkShoulderX, honkIntensity);
                const leftShoulderY = lerp(restShoulderY, honkShoulderY, honkIntensity);
                const leftShoulderZ = lerp(restShoulderZ, honkShoulderZ, honkIntensity);
                const leftElbowX = lerp(restElbowX, honkElbowX, honkIntensity);
                const leftElbowZ = lerp(restElbowZ, honkElbowZ, honkIntensity);

                setRotation(this.skeleton.leftShoulder, leftShoulderX, leftShoulderY, leftShoulderZ);
                setRotation(this.skeleton.leftElbow, leftElbowX, 0, leftElbowZ); // elbowY selalu 0

                const pressDurationReal = PHASE_5_DURATION * pressDuration;
                const delaySeconds = 0.6;
                const delayNormalized = delaySeconds / pressDurationReal;
                const tHonkNormalized_Belly = Math.max(0, (tPressNormalized - delayNormalized) / (1.0 - delayNormalized));
                const honkIntensity_Belly = Math.abs(Math.sin(tHonkNormalized_Belly * 2 * Math.PI));

                let currentRedBellyScale = 1.0;
                if (this.offsetMesh.redBellyOffset) {
                    const honkScale = 1.0 + honkIntensity_Belly * 0.15;
                    currentRedBellyScale = honkScale;

                    this.offsetMesh.redBellyOffset = createModelMatrix({
                        translate: [0, 0.35, 2],
                        scale: [honkScale, honkScale, honkScale]
                    });
                }

                pose = {
                    hipYOffset: hipY, hipZ: hipZ,
                    // Tangan Kiri (sudah diupdate)
                    leftShoulder_x: leftShoulderX, leftShoulder_y: leftShoulderY, leftShoulder_z: leftShoulderZ,
                    leftElbow_x: leftElbowX, leftElbow_y: 0, leftElbow_z: leftElbowZ,
                    // Tangan Kanan
                    rightShoulder_x: rightShoulderX, rightShoulder_y: rightArmStatic.rightShoulder_y, rightShoulder_z: rightArmStatic.rightShoulder_z,
                    rightElbow_x: rightElbowX, rightElbow_y: rightArmStatic.rightElbow_y, rightElbow_z: 0,

                    // Simpan scale saat ini untuk transisi
                    redBellyScale: currentRedBellyScale

                };
            }

            // Simpan pose akhir dari fase 5
            this.lastPose = pose;
        }

        // =================================================================
        // TRANSISI 5 -> 1: Kembali ke pose awal (jalan) (1.0 detik)
        // =================================================================
        else { // (timeInCycle < END_TRANSITION_5_1)
            const transitionTime = timeInCycle - START_TRANSITION_5_1;
            const t = easeInOutQuad(clamp01(transitionTime / TRANSITION_5_1_DURATION));

            const posePrev = this.lastPose;
            // Targetnya adalah pose awal dari Phase 1
            const poseNext = posePhase1_Start;

            // Transisi semua bagian tubuh
            const hipYOffset = lerp(posePrev.hipYOffset, poseNext.hipYOffset, t);
            const hipZ = lerp(posePrev.hipZ, poseNext.hipZ, t);
            this.skeleton.hip.setLocalSpec({ translate: [baseX, baseY + hipYOffset, baseZ + hipZ] });

            // // Kaki
            // setLocalRotationAxisAngle(this.skeleton.upperRightLeg, 'x', lerp(posePrev.upperRightLeg_x, poseNext.upperRightLeg_x, t));
            // setLocalRotationAxisAngle(this.skeleton.upperLeftLeg, 'x', lerp(posePrev.upperLeftLeg_x, poseNext.upperLeftLeg_x, t));
            // setLocalRotationAxisAngle(this.skeleton.rightKnee, 'x', lerp(posePrev.rightKnee_x, poseNext.rightKnee_x, t));
            // setLocalRotationAxisAngle(this.skeleton.leftKnee, 'x', lerp(posePrev.leftKnee_x, poseNext.leftKnee_x, t));

            // Tangan kiri
            setRotation(this.skeleton.leftShoulder,
                lerp(posePrev.leftShoulder_x, poseNext.leftShoulder_x, t),
                lerp(posePrev.leftShoulder_y, poseNext.leftShoulder_y, t),
                lerp(posePrev.leftShoulder_z, poseNext.leftShoulder_z, t)
            );
            setRotation(this.skeleton.leftElbow,
                lerp(posePrev.leftElbow_x, poseNext.leftElbow_x, t),
                lerp(posePrev.leftElbow_y, poseNext.leftElbow_y, t),
                lerp(posePrev.leftElbow_z, poseNext.leftElbow_z, t)
            );

            // Tangan kanan
            setRotation(this.skeleton.rightShoulder,
                lerp(posePrev.rightShoulder_x, poseNext.rightShoulder_x, t),
                lerp(posePrev.rightShoulder_y, poseNext.rightShoulder_y, t),
                lerp(posePrev.rightShoulder_z, poseNext.rightShoulder_z, t)
            );
            setRotation(this.skeleton.rightElbow,
                lerp(posePrev.rightElbow_x, poseNext.rightElbow_x, t),
                lerp(posePrev.rightElbow_y, poseNext.rightElbow_y, t),
                lerp(posePrev.rightElbow_z, poseNext.rightElbow_z, t)
            );

            let currentRedBellyScale = 1.0;
            if (this.offsetMesh.redBellyOffset) {
                const startScale = posePrev.redBellyScale || 1.0;

                const scaleValue = lerp(startScale, 1.0, t);
                currentRedBellyScale = scaleValue;

                this.offsetMesh.redBellyOffset = createModelMatrix({
                    translate: [0, 0.35, 2],
                    scale: [scaleValue, scaleValue, scaleValue]
                });
            }

            // Simpan pose
            this.lastPose = {
                hipYOffset: hipYOffset,
                hipZ: hipZ,
                upperRightLeg_x: lerp(posePrev.upperRightLeg_x, poseNext.upperRightLeg_x, t),
                upperLeftLeg_x: lerp(posePrev.upperLeftLeg_x, poseNext.upperLeftLeg_x, t),
                rightKnee_x: lerp(posePrev.rightKnee_x, poseNext.rightKnee_x, t),
                leftKnee_x: lerp(posePrev.leftKnee_x, poseNext.leftKnee_x, t),
                leftShoulder_x: lerp(posePrev.leftShoulder_x, poseNext.leftShoulder_x, t),
                leftShoulder_y: lerp(posePrev.leftShoulder_y, poseNext.leftShoulder_y, t),
                leftShoulder_z: lerp(posePrev.leftShoulder_z, poseNext.leftShoulder_z, t),
                leftElbow_x: lerp(posePrev.leftElbow_x, poseNext.leftElbow_x, t),
                leftElbow_y: lerp(posePrev.leftElbow_y, poseNext.leftElbow_y, t),
                leftElbow_z: lerp(posePrev.leftElbow_z, poseNext.leftElbow_z, t),
                rightShoulder_x: lerp(posePrev.rightShoulder_x, poseNext.rightShoulder_x, t),
                rightShoulder_y: lerp(posePrev.rightShoulder_y, poseNext.rightShoulder_y, t),
                rightShoulder_z: lerp(posePrev.rightShoulder_z, poseNext.rightShoulder_z, t),
                rightElbow_x: lerp(posePrev.rightElbow_x, poseNext.rightElbow_x, t),
                rightElbow_y: lerp(posePrev.rightElbow_y, poseNext.rightElbow_y, t),
                rightElbow_z: lerp(posePrev.rightElbow_z, poseNext.rightElbow_z, t),

                // Simpan scale untuk frame selanjutnya
                redBellyScale: currentRedBellyScale
            };
        }



        // Panggil updateWorld() di akhir
        this.updateWorld();
    }



    drawObject() {
        //Shoes and staff color 0.514, 0.792, 0.957
        //face 0.91, 0.78, 0.808
        //BLACK 0.392, 0.361, 0.467

        //HAT
        drawObject(this.meshes.lowerHat.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.lowerHatOffset), [0.392, 0.361, 0.467], GL.TRIANGLES)
        drawObject(this.meshes.upperHat.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.upperHatOffset), [0.392, 0.361, 0.467], GL.TRIANGLES)

        //Winghat
        drawObject(this.meshes.wingCurvesHat.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.leftWingCurvesHatOffset), [0.392, 0.361, 0.467], GL.TRIANGLES)
        drawObject(this.meshes.wingCurvesHat.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.rightWingCurvesHatOffset), [0.392, 0.361, 0.467], GL.TRIANGLES)

        drawObject(this.meshes.wingHat.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.leftWingOffset1), [0.392, 0.361, 0.467], GL.TRIANGLES)
        drawObject(this.meshes.wingHat.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.leftWingOffset2), [0.392, 0.361, 0.467], GL.TRIANGLES)
        drawObject(this.meshes.wingHat.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.rightWingOffset1), [0.392, 0.361, 0.467], GL.TRIANGLES)
        drawObject(this.meshes.wingHat.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.rightWingOffset2), [0.392, 0.361, 0.467], GL.TRIANGLES)

        drawObject(this.meshes.wingCurveConnect.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.leftWingCurveConnectOffset), [0.392, 0.361, 0.467], GL.TRIANGLES)
        drawObject(this.meshes.wingCurveConnect.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.rightWingCurveConnectOffset), [0.392, 0.361, 0.467], GL.TRIANGLES)




        //HEAD
        drawObject(this.meshes.blackHead.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.blackHeadOffset), [0.392, 0.361, 0.467], GL.TRIANGLES)
        drawObject(this.meshes.face.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.faceOffset), [0.91, 0.78, 0.808], GL.TRIANGLES)
        //  OUTER WHITE EYES
        drawObject(this.meshes.eyes.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.outerWhiteRightEye), [1, 1, 1], GL.TRIANGLES)
        drawObject(this.meshes.eyes.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.outerWhiteLeftEye), [1, 1, 1], GL.TRIANGLES)
        //  YELLOW EYES
        drawObject(this.meshes.eyes.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.yellowRightEye), [0.863, 0.741, 0.475], GL.TRIANGLES)
        drawObject(this.meshes.eyes.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.yellowLeftEye), [0.863, 0.741, 0.475], GL.TRIANGLES)
        //  INNER WHITE EYES
        drawObject(this.meshes.eyes.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.innerWhiteRightEye), [1, 1, 1], GL.TRIANGLES)
        drawObject(this.meshes.eyes.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.innerWhiteLeftEye), [1, 1, 1], GL.TRIANGLES)


        // MUSTACHE
        drawObject(this.meshes.upperMustache.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.upperMustacheOffset), [0.392, 0.361, 0.467], GL.TRIANGLES)
        drawObject(this.meshes.lowerMustache.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.leftLowerMustacheOffset), [0.392, 0.361, 0.467], GL.TRIANGLES)
        drawObject(this.meshes.lowerMustache.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.rightLowerMustacheOffset), [0.392, 0.361, 0.467], GL.TRIANGLES)





        //LOWER BLUE BODY
        drawObject(this.meshes.lowerBody.solid.buffers, makeModel(this.skeleton.hip, this.offsetMesh.lowerBodyOffset), [0.341, 0.549, 0.957], GL.TRIANGLES)

        //WHITE BELLY
        drawObject(this.meshes.whiteBelly.solid.buffers, makeModel(this.skeleton.hip, this.offsetMesh.whiteBellyOffset), [1, 1, 1], GL.TRIANGLES)

        //LOWER BLACK CLOTHES
        drawObject(this.meshes.sideBlackClothes.solid.buffers, makeModel(this.skeleton.hip, this.offsetMesh.leftBlackClothesOffset), [0.392, 0.361, 0.467], GL.TRIANGLES)
        drawObject(this.meshes.sideBlackClothes.solid.buffers, makeModel(this.skeleton.hip, this.offsetMesh.rightBlackClothesOffset), [0.392, 0.361, 0.467], GL.TRIANGLES)

        //BLACK SHOULDER
        drawObject(this.meshes.sideBlackShoulder.solid.buffers, makeModel(this.skeleton.leftShoulder, this.offsetMesh.rightShoulderOffset), [0.392, 0.361, 0.467], GL.TRIANGLES)
        drawObject(this.meshes.sideBlackShoulder.solid.buffers, makeModel(this.skeleton.rightShoulder, this.offsetMesh.leftShoulderOffset), [0.392, 0.361, 0.467], GL.TRIANGLES)

        //BACK BLACK CLOTHES
        drawObject(this.meshes.backBlackClothes.solid.buffers, makeModel(this.skeleton.hip, this.offsetMesh.backBlackClothesOffset), [0.392, 0.361, 0.467], GL.TRIANGLES)

        //UPPER BLACK CLOTHES
        drawObject(this.meshes.upperBlackClothes.solid.buffers, makeModel(this.skeleton.neck, this.offsetMesh.upperBlackClothesOffset), [0.392, 0.361, 0.467], GL.TRIANGLES)

        //ACCESSORIES
        drawObject(this.meshes.redBelly.solid.buffers, makeModel(this.skeleton.hip, this.offsetMesh.redBellyOffset), [0.529, 0.267, 0.345], GL.TRIANGLES)
        drawObject(this.meshes.yellowBelly.solid.buffers, makeModel(this.skeleton.hip, this.offsetMesh.leftYellowBellyOffset), [0.957, 0.816, 0.463], GL.TRIANGLES)
        drawObject(this.meshes.yellowBelly.solid.buffers, makeModel(this.skeleton.hip, this.offsetMesh.rightYellowBellyOffset), [0.957, 0.816, 0.463], GL.TRIANGLES)


        //ARMS
        //  UPPER ARMS
        drawObject(this.meshes.arm.solid.buffers, makeModel(this.skeleton.rightShoulder, this.offsetMesh.upperRightArmOffset), [0.341, 0.549, 0.957], GL.TRIANGLES)
        drawObject(this.meshes.arm.solid.buffers, makeModel(this.skeleton.leftShoulder, this.offsetMesh.upperLeftArmOffset), [0.341, 0.549, 0.957], GL.TRIANGLES)
        //  ELBOW
        drawObject(this.meshes.elbow.solid.buffers, makeModel(this.skeleton.rightElbow, this.offsetMesh.elbowOffset), [0.341, 0.549, 0.957], GL.TRIANGLES)
        drawObject(this.meshes.elbow.solid.buffers, makeModel(this.skeleton.leftElbow, this.offsetMesh.elbowOffset), [0.341, 0.549, 0.957], GL.TRIANGLES)
        //  LOWER ARMS
        drawObject(this.meshes.arm.solid.buffers, makeModel(this.skeleton.rightElbow, this.offsetMesh.lowerRightArmOffset), [0.341, 0.549, 0.957], GL.TRIANGLES)
        drawObject(this.meshes.arm.solid.buffers, makeModel(this.skeleton.leftElbow, this.offsetMesh.lowerLeftArmOffset), [0.341, 0.549, 0.957], GL.TRIANGLES)
        //  HANDS
        drawObject(this.meshes.hands.solid.buffers, makeModel(this.skeleton.rightHand, this.offsetMesh.rightHandOffset), [0.941, 0.914, 0.937], GL.TRIANGLES)
        drawObject(this.meshes.hands.solid.buffers, makeModel(this.skeleton.leftHand, this.offsetMesh.leftHandOffset), [0.941, 0.914, 0.937], GL.TRIANGLES)

        drawObject(this.meshes.thumbs.solid.buffers, makeModel(this.skeleton.rightThumb, this.offsetMesh.rightThumbsOffset), [0.941, 0.914, 0.937], GL.TRIANGLES)
        drawObject(this.meshes.thumbs.solid.buffers, makeModel(this.skeleton.leftThumb, this.offsetMesh.leftThumbsOffset), [0.941, 0.914, 0.937], GL.TRIANGLES)

        drawObject(this.meshes.fingers.solid.buffers, makeModel(this.skeleton.rightFinger, this.offsetMesh.rightFingersOffset), [0.941, 0.914, 0.937], GL.TRIANGLES)
        drawObject(this.meshes.fingers.solid.buffers, makeModel(this.skeleton.leftFinger, this.offsetMesh.leftFingersOffset), [0.941, 0.914, 0.937], GL.TRIANGLES)

        //LEGS
        drawObject(this.meshes.upperLegs.solid.buffers, makeModel(this.skeleton.upperLeftLeg, this.offsetMesh.blueLeftUpperLegOffset), [0.341, 0.549, 0.957], GL.TRIANGLES)
        drawObject(this.meshes.upperLegs.solid.buffers, makeModel(this.skeleton.upperRightLeg, this.offsetMesh.blueRightUpperLegOffset), [0.341, 0.549, 0.957], GL.TRIANGLES)
        drawObject(this.meshes.lowerLegs.solid.buffers, makeModel(this.skeleton.leftKnee, this.offsetMesh.blueLeftLowerLegOffset), [0.341, 0.549, 0.957], GL.TRIANGLES)
        drawObject(this.meshes.lowerLegs.solid.buffers, makeModel(this.skeleton.rightKnee, this.offsetMesh.blueRightLowerLegOffset), [0.341, 0.549, 0.957], GL.TRIANGLES)

        drawObject(this.meshes.blackShoes.solid.buffers, makeModel(this.skeleton.leftShoes, this.offsetMesh.blackLeftShoesOffset), [0.392, 0.361, 0.467], GL.TRIANGLES)
        drawObject(this.meshes.blackShoes.solid.buffers, makeModel(this.skeleton.rightShoes, this.offsetMesh.blackRightShoesOffset), [0.392, 0.361, 0.467], GL.TRIANGLES)
        drawObject(this.meshes.iceShoes.solid.buffers, makeModel(this.skeleton.rightShoes, this.offsetMesh.iceRightShoesOffset), [0.6, 0.886, 0.957], GL.TRIANGLES)
        drawObject(this.meshes.iceShoes.solid.buffers, makeModel(this.skeleton.leftShoes, this.offsetMesh.iceLeftShoesOffset), [0.6, 0.886, 0.957], GL.TRIANGLES)

        drawObject(this.meshes.connectShoes.solid.buffers, makeModel(this.skeleton.leftShoes, this.offsetMesh.leftShoeConnect), [0.6, 0.886, 0.957], GL.TRIANGLES)
        drawObject(this.meshes.connectShoes.solid.buffers, makeModel(this.skeleton.rightShoes, this.offsetMesh.rightShoeConnect), [0.6, 0.886, 0.957], GL.TRIANGLES)


        drawObject(this.meshes.staff.solid.buffers, makeModel(this.skeleton.rightHand, this.offsetMesh.staffOffset), [0.6, 0.886, 0.957], GL.TRIANGLES)
    }
}