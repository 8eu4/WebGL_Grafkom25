import { BaseCharacter } from '/process/BaseCharacter.js';
import { createModelMatrix, createMesh, drawObject, applyTransformToMesh, recenterMesh } from '../CreateObject.js';
import { MeshUtilsCurves } from '../MeshUtilsCurves.js';
import { MeshUtils } from '../MeshUtils.js';
import * as Curves from '../curves.js';
import { meshToCSG, CSGBuilder } from "../csgOperation.js";
import { makeModel } from "../bone.js";
import { GL, attribs } from '../main.js'

export class mime_jr extends BaseCharacter {
    constructor() {
        super();

        //MESH 
        this.meshes = {

            bodyMesh:createMesh(MeshUtils.generateEllipticParaboloid, { params: [1,1,1.5,32,16], deferBuffer: false}),
            headMesh:createMesh(MeshUtils.generateEllipsoid, {params: [1.4,1,1.5,32,64], deferBuffer: false}),
            leftHairMesh:createMesh(MeshUtils.generateEllipsoid, {params: [0.6,0.7,0.8,32,64], deferBuffer: false}),
            rightHairMesh:createMesh(MeshUtils.generateEllipsoid, {params: [0.6,0.7,0.8,32,64], deferBuffer: false}), 
            backHairMesh:createMesh(MeshUtils.generateEllipsoid, {params: [1.5,0.78,1,32,64], deferBuffer: false}), 
            // topHairMesh:createMesh(MeshUtils.generateEllipsoid, {params: [1.28,1.3,1,32,64], deferBuffer: false}), 
            donut:createMesh(MeshUtils.generateTorus, {params:[1, 1, 64, 64], deferBuffer: false})
            // #6 Buffer mesh hasil mesh ke GPU
            // holeOnCubeMesh: MeshUtils.createMeshBuffers(GL, holeOnCubeMesh, attribs)

        }

        this.skeleton = {
            body: this.createBone("body", null, {translate: [0,0,0]}),
            head: this.createBone("head", "body", {translate:[0,0.9,0]}),
            lefthair: this.createBone("lefthair", "head", {translate:[1.4,0,0]}),
            righthair: this.createBone("righthair", "head", {translate:[-1.4,0,0]}),
            backhair: this.createBone("backhair", "head", {translate:[0,0,-0.8]}),
            // tophair: this.createBone("tophair", "head", {translate:[0,0.7,0.05]}),
            donut: this.createBone("donut", "head", {translate:[0,0.7,0.05]}),
        }   

        this.updateWorld();

        this.offsetMesh = {
            bodyOffset: createModelMatrix({translate:[0, 0, 0], rotate:[
                { axis: "x", angle: Math.PI/2 },] // rotasi 90° sumbu X
            }),
            headOffset: createModelMatrix({translate:[0,0,0]}),
            lefthairOffset: createModelMatrix({translate:[0,0,0]}),
            righthairOffset: createModelMatrix({translate:[0,0,0]}),
            backhairOffset: createModelMatrix({translate:[0,0,0]}),
            donutOffset: createModelMatrix({translate:[0,0,0]}),
            // tophairOffset: createModelMatrix({translate:[0,0,0], rotate:[
            //     { axis: "x", angle: Math.PI/2 },] // rotasi 90° sumbu X
            // }),
        }
    }


    animate(time) {

    }


    drawObject(){
        drawObject(this.meshes.bodyMesh.solid.buffers, makeModel(this.skeleton.body, this.offsetMesh.bodyOffset), [1, 0.78, 0.94], GL.TRIANGLES)
        drawObject(this.meshes.headMesh.solid.buffers, makeModel(this.skeleton.head, this.offsetMesh.headOffset), [1, 0.78, 0.94], GL.TRIANGLES)
        drawObject(this.meshes.leftHairMesh.solid.buffers, makeModel(this.skeleton.lefthair, this.offsetMesh.lefthairOffset), [0.157, 0.392, 0.522], GL.TRIANGLES)
        drawObject(this.meshes.rightHairMesh.solid.buffers, makeModel(this.skeleton.righthair, this.offsetMesh.righthairOffset), [0.157, 0.392, 0.522], GL.TRIANGLES)
        drawObject(this.meshes.backHairMesh.solid.buffers, makeModel(this.skeleton.backhair, this.offsetMesh.backhairOffset), [0.157, 0.392, 0.522], GL.TRIANGLES)
        // drawObject(this.meshes.topHairMesh.solid.buffers, makeModel(this.skeleton.tophair, this.offsetMesh.tophairOffset), [0.157, 0.392, 0.522], GL.TRIANGLES)
        // drawObject(this.meshes.topHairMesh.solid.buffers, makeModel(this.skeleton.tophair, this.offsetMesh.tophairOffset), [0.157, 0.392, 0.522], GL.TRIANGLES)
        
    }
}