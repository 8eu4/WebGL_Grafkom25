import { BaseCharacter } from '/process/BaseCharacter.js';
import { createModelMatrix, createMesh, drawObject, applyTransformToMesh, recenterMesh, cutMesh } from '../CreateObject.js';
import { MeshUtilsCurves, rotateAroundAxis } from '../MeshUtilsCurves.js';
import { MeshUtils } from '../MeshUtils.js';
import * as Curves from '../curves.js';
import { meshToCSG, CSGBuilder } from "../csgOperation.js";
import { makeModel, applyBoneOffsetMesh } from "../bone.js";
import { GL, attribs } from '../main.js'

export class mr_rime extends BaseCharacter {
    constructor() {
        super();

        const upperHat = createMesh(MeshUtils.generateEllipsoid, { params: [1.5, 1.3, 1.5, 32, 64], deferBuffer: false });
        // const hatCloser = createMesh(MeshUtils.generateHyperboloid2Sheets, { params: [1, 1, 0.5, 32, 32, 1.0], cutOptions: { percent: 0.5, axis: "z", keep: "lower" }, deferBuffer: false });


        const upperFaceMesh = createMesh(MeshUtils.generateEllipsoid,
            { params: [1.6, 1.5, 1.5, 64, 64], cutOptions: { percent: 0.5, axis: "y", keep: "upper" }, deferBuffer: true });

        const lowerFaceMesh = createMesh(MeshUtils.generateEllipsoid,
            { params: [1.75, 1.2, 1.5, 64, 64], cutOptions: { percent: 0.5, axis: "y", keep: "lower" }, deferBuffer: true });

        const middleFaceMesh = createMesh(MeshUtils.generateEllipticalCylinder,
            { params: [1.6, 1.5, 1.75, 1.5, 2, 64, 1, true], deferBuffer: true });

        // const cut = lowerFaceMesh;
        // console.log("cut positions", cut.positions.length / 3);
        // console.log("cut indices", cut.indices.length / 3);
        // console.log("cut normals sample", cut.normals ? Array.from(cut.normals.slice(0, 12)) : "NO NORMALS");



        // upperFaceMesh.solid.buffers = MeshUtils.createMeshBuffers(GL, upperFaceMesh.solid.mesh, attribs);
        // lowerFaceMesh.solid.buffers = MeshUtils.createMeshBuffers(GL, lowerFaceMesh.solid.mesh, attribs);
        // middleFaceMesh.solid.buffers = MeshUtils.createMeshBuffers(GL, middleFaceMesh.solid.mesh, attribs);



        // // ==== apply transforms sebelum merge ====
        // upperFaceMesh.solid.mesh = applyTransformToMesh(upperFaceMesh.solid.mesh, {
        //     translate: [0, 0, 0]
        // });

        // lowerFaceMesh.solid.mesh = applyTransformToMesh(lowerFaceMesh.solid.mesh, {
        //     translate: [0, 0, 0],
        //     rotate: [
        //         { axis: "y", angle: Math.PI }
        //     ]
        // });

        // middleFaceMesh.solid.mesh = applyTransformToMesh(middleFaceMesh.solid.mesh, {
        //     translate: [0, 0, 0],
        // });


        //MESH 
        this.meshes = {
            // face: face,

            // upperFaceMesh: upperFaceMesh,
            // lowerFaceMesh: lowerFaceMesh,
            // middleFaceMesh: middleFaceMesh,

            // blackHeadMesh: createMesh(MeshUtils.generateEllipsoid, { params: [1.9, 1.665, 1.665, 32, 64], cutOptions: { percent: 0.83, axis: "z", keep: "lower" }, deferBuffer: false }),

            // lowerHat: createMesh(MeshUtils.generateTorus, { params: [1.7, 0.33, 64, 24], deferBuffer: false }),

            // upperHat: upperHat,

            // upperFace: createMesh(MeshUtils.generateEllipticParaboloid, 
            //     { params: [1, 1, 2, 32, 16], deferBuffer: false }),

            // lowerFace: createMesh(MeshUtils.generateEllipticalCylinder, 
            //     { params: [1, 0.5, 1, 0.5, 2, 32, 1, true], deferBuffer: false }),
            // hatCloser: hatCloser,
            // chestMesh: createMesh(MeshUtils.generateEllipsoid, { params: [0.9, 0.9, 0.45], deferBuffer: false }),


            // bodyMesh:createMesh(MeshUtils.generateEllipticParaboloid, { params: [1,1,1.5,32,16], deferBuffer: false}),

            // #6 Buffer mesh hasil mesh ke GPU
            // holeOnCubeMesh: MeshUtils.createMeshBuffers(GL, holeOnCubeMesh, attribs)

            lowerBody:createMesh(MeshUtils.generateEllipsoid, { params: [2, 2, 2, 32, 64], deferBuffer: false }),
            whiteBelly:createMesh(MeshUtils.generateEllipsoid, { params: [1.2, 1.2, 0.5, 32, 64], deferBuffer: false }),
            blackClothes:createMesh(MeshUtils.generateEllipsoid, { params: [1.6, 1.9, 1.6, 32, 64], deferBuffer: false }),
            backblackClothes:createMesh(MeshUtils.generateEllipsoid, { params: [2, 2, 1.5, 32, 64], deferBuffer: false }),
            backblackClothes:createMesh(MeshUtils.generateEllipsoid, { params: [2, 2, 1.5, 32, 64], deferBuffer: false }),
            redBelly:createMesh(MeshUtils.generateEllipsoid, { params: [1.1, 0.8, 0.5, 32, 64], deferBuffer: false }),
            yellowBelly:createMesh(MeshUtils.generateEllipsoid, { params: [0.2, 0.4, 0.2, 32, 64], deferBuffer: false }),
            upperBody:createMesh(MeshUtils.generateTorus, { params: [0.45, 0.9, 64, 64], deferBuffer: false }),

        }

        this.skeleton = {
            hip: this.createBone("hip", null, { translate: [0, 0, 0] }),
            spine: this.createBone("spine", "hip", { translate: [0, 2, 0] }),
            upperBody: this.createBone("upperBody", "spine", { translate: [0, 0.7, 0] }),
            head: this.createBone("head", "upperBody", { translate: [0, 0, 0] }),

            hat: this.createBone("hat", "head", { translate: [0, 0.95, 0] }),

        }

        this.updateWorld();

        this.offsetMesh = {
            // blackHeadOffset: createModelMatrix({
            //     translate: [0, 0, -0.2]
            // }),
            // faceOffset: createModelMatrix({
            //     translate: [0, 0, 0],
            //     scale: [1, 1, 1]
            // }),
            // upperHatOffset: createModelMatrix({
            //     translate: [0, 0.3, -0.2]
            // }),
            // lowerHatOffset: createModelMatrix({
            //     translate: [0, 0, -0.2]
            // }),

            // upperFaceOffset: createModelMatrix({
            //     translate: [0, 0.6, 0],
            //     scale: [1, 0.6, 1]
            // }),

            // lowerFaceOffset: createModelMatrix({
            //     translate: [0, -0.6, 0],
            //     rotate: [
            //         { axis: "y", angle: Math.PI },
            //         // {axis: "y", angle: Math.PI },
            //     ],
            //     scale: [1, 0.6, 1]
            // }),

            // middleFaceOffset: createModelMatrix({
            //     translate: [0, 0, 0],
            //     scale: [1, 0.6, 1]
            // }),

            // hatCloserOffset: createModelMatrix({
            //     translate: [0, 2.3, -0.2],
            //     rotate: [
            //         { axis: "x", angle: Math.PI z/ -2 },
            //     ]
            // }),

            lowerBodyOffset:createModelMatrix({
                translate:[0,0,0]
            }),
            upperBodyOffset:createModelMatrix({
                translate:[0,0.4,0]
            }),
            whiteBellyOffset:createModelMatrix({
                translate:[0,0,1.5]
            }),
            leftblackClothesOffset:createModelMatrix({
                translate:[-0.5,0.24,0.3]
            }),
            rightblackClothesOffset:createModelMatrix({
                translate:[0.5,0.24,0.3]
            }),
            backblackClothesOffset:createModelMatrix({
                translate:[0,0,-0.5]
            }),
            redBellyOffset:createModelMatrix({
                translate:[0,0,1.7]
            }),
            leftyellowBellyOffset:createModelMatrix({
                translate:[-1.5,0,1.4]
            }),
            rightyellowBellyOffset:createModelMatrix({
                translate:[1.5,0,1.4]
            }),



        }
    }

    animate(time) {

        this.updateWorld();
    }


    drawObject() {
        // drawObject(this.meshes.blackHeadMesh.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.blackHeadOffset), [0.353, 0.329, 0.427], GL.TRIANGLES)

        // // Upper face
        // let upper = applyBoneOffsetMesh(this.skeleton.head, this.meshes.upperFaceMesh.solid.mesh, this.offsetMesh.upperFaceOffset);
        // drawObject(upper.buffers, upper.modelMatrix, [0.965, 0.843, 0.867], GL.TRIANGLES);

        // // Middle face
        // let middle = applyBoneOffsetMesh(this.skeleton.head, this.meshes.middleFaceMesh.solid.mesh, this.offsetMesh.middleFaceOffset);
        // drawObject(middle.buffers, middle.modelMatrix, [0.965, 0.843, 0.867], GL.TRIANGLES);

        // // Lower face
        // let lower = applyBoneOffsetMesh(this.skeleton.head, this.meshes.lowerFaceMesh.solid.mesh, this.offsetMesh.lowerFaceOffset);
        // drawObject(lower.buffers, lower.modelMatrix, [0.965, 0.843, 0.867], GL.TRIANGLES);

        // drawObject(this.meshes.lowerHat.solid.buffers, makeModel(this.skeleton.hat, this.offsetMesh.lowerHatOffset), [0.353, 0.329, 0.427], GL.TRIANGLES)
        // drawObject(this.meshes.upperHat.solid.buffers, makeModel(this.skeleton.hat, this.offsetMesh.upperHatOffset), [0.353, 0.329, 0.427], GL.TRIANGLES)

        // drawObject(this.meshes.hatCloser.solid.buffers, makeModel(this.skeleton.hat, this.offsetMesh.hatCloserOffset), [0.353, 0.329, 0.427], GL.TRIANGLES)
        // drawObject(this.meshes.upperFace.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.upperFaceOffset), [0.5,0.5,0.5], GL.TRIANGLES)

        // drawObject(this.meshes.face.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.lowerFaceOffset), [0.965, 0.843, 0.867], GL.TRIANGLES)

        drawObject(this.meshes.lowerBody.solid.buffers, makeModel(this.skeleton.hip, this.offsetMesh.lowerBodyOffset),  [0.286, 0.412, 0.682], GL.TRIANGLES)
        drawObject(this.meshes.whiteBelly.solid.buffers, makeModel(this.skeleton.hip, this.offsetMesh.whiteBellyOffset),  [1,1,1], GL.TRIANGLES)
        drawObject(this.meshes.blackClothes.solid.buffers, makeModel(this.skeleton.hip, this.offsetMesh.leftblackClothesOffset),  [0.392, 0.361, 0.467], GL.TRIANGLES)
        drawObject(this.meshes.blackClothes.solid.buffers, makeModel(this.skeleton.hip, this.offsetMesh.rightblackClothesOffset),  [0.392, 0.361, 0.467], GL.TRIANGLES)
        drawObject(this.meshes.backblackClothes.solid.buffers, makeModel(this.skeleton.hip, this.offsetMesh.backblackClothesOffset),  [0.392, 0.361, 0.467], GL.TRIANGLES)
        drawObject(this.meshes.redBelly.solid.buffers, makeModel(this.skeleton.hip, this.offsetMesh.redBellyOffset),  [0.529, 0.267, 0.345], GL.TRIANGLES)
        drawObject(this.meshes.yellowBelly.solid.buffers, makeModel(this.skeleton.hip, this.offsetMesh.leftyellowBellyOffset),  [0.957, 0.816, 0.463], GL.TRIANGLES)
        drawObject(this.meshes.yellowBelly.solid.buffers, makeModel(this.skeleton.hip, this.offsetMesh.rightyellowBellyOffset),  [0.957, 0.816, 0.463], GL.TRIANGLES)
        drawObject(this.meshes.upperBody.solid.buffers, makeModel(this.skeleton.spine, this.offsetMesh.upperBodyOffset),  [0.392, 0.361, 0.467], GL.TRIANGLES)
    
    }
}