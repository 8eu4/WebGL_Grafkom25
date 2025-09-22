import { BaseCharacter } from '/process/BaseCharacter.js';
import { createModelMatrix, createMesh, drawObject, applyTransformToMesh, recenterMesh } from '../CreateObject.js';
import { MeshUtilsCurves } from '../MeshUtilsCurves.js';
import { MeshUtils } from '../MeshUtils.js';
import * as Curves from '../curves.js';
import { meshToCSG, CSGBuilder } from "../csgOperation.js";
import { makeModel } from "../bone.js";
import { GL, attribs } from '../main.js'

export class mr_rime extends BaseCharacter {
    constructor() {
        super();

        //MESH 
        this.meshes = {

            bodyMesh:createMesh(MeshUtils.generateEllipticParaboloid, { params: [1,1,1.5,32,16], deferBuffer: false}),
            
            // #6 Buffer mesh hasil mesh ke GPU
            // holeOnCubeMesh: MeshUtils.createMeshBuffers(GL, holeOnCubeMesh, attribs)

        }

        this.skeleton = {
            neck: this.createBone("neck", null, {translate: [0,0,0]}),
            
        
            
        }   

        this.updateWorld();

        this.offsetMesh = {
            bodyOffset: createModelMatrix({translate:[0, 0, 0], rotate:[
                { axis: "x", angle: Math.PI/2 },] // rotasi 90° sumbu X
            }),
            
            
        }
    }

    animate(time) {

    }


    drawObject(){
        drawObject(this.meshes.bodyMesh.solid.buffers, makeModel(this.skeleton.neck, this.offsetMesh.bodyOffset), [1, 0.78, 0.94], GL.TRIANGLES)
        
        
    }
}