import { createModelMatrix, drawObject } from './CreateObject.js';
import { GL, attribs, proj, view, uMVP, uColor, uModel, uNormalMat, uIsBone, uColorBone } from './main.js'

export class Bone {
    constructor(name, parent = null, localSpec = { translate: [0, 0, 0], rotate: [], scale: [1, 1, 1] }) {
        this.name = name;
        this.parent = parent;
        this.children = [];
        if (parent) parent.children.push(this);

        // store transform spec and matrices
        this.localSpec = localSpec;
        this.localMatrix = createModelMatrix(localSpec);
        this.worldMatrix = mat4.create();

        // create helper line buffers (we will update positions each frame)
        this.helperBuffers = this._createHelperBuffers();
    }

    setLocalSpec(spec) {
        // partial update allowed (merge)
        this.localSpec = Object.assign({}, this.localSpec, spec);
        this.localMatrix = createModelMatrix(this.localSpec);
    }

    // recursive update world matrices
    updateWorld(parentWorld = null) {
        if (parentWorld) {
            mat4.multiply(this.worldMatrix, parentWorld, this.localMatrix);
        } else {
            mat4.copy(this.worldMatrix, this.localMatrix);
        }
        for (const c of this.children) c.updateWorld(this.worldMatrix);
    }

    getWorldMatrix() {
        return this.worldMatrix;
    }

    _createHelperBuffers() {
        // Two vertices (will be filled each frame). Index [0,1].
        const posBuf = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, posBuf);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(6), GL.DYNAMIC_DRAW);

        const idxBuf = GL.createBuffer();
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, idxBuf);
        const idxArr = new Uint16Array([0, 1]);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, idxArr, GL.STATIC_DRAW);

        return {
            positionBuffer: posBuf,
            indexBuffer: idxBuf,
            indexCount: 2,
            indexType: GL.UNSIGNED_SHORT
        };
    }

    // draw a helper line from this parent -> this bone position (if parent exists)
    drawHelper() {
        if (this.parent) {
            const pv = vec3.fromValues(0, 0, 0);
            const bv = vec3.fromValues(0, 0, 0);
            vec3.transformMat4(pv, pv, this.parent.worldMatrix);
            vec3.transformMat4(bv, bv, this.worldMatrix);

            const linePos = new Float32Array([
                pv[0], pv[1], pv[2],
                bv[0], bv[1], bv[2]
            ]);

            // update posisi buffer
            GL.bindBuffer(GL.ARRAY_BUFFER, this.helperBuffers.positionBuffer);
            GL.bufferSubData(GL.ARRAY_BUFFER, 0, linePos);

            const drawBuf = {
                positionBuffer: this.helperBuffers.positionBuffer,
                indexBuffer: this.helperBuffers.indexBuffer,
                indexCount: this.helperBuffers.indexCount,
                indexType: this.helperBuffers.indexType
            };

            const identityModel = mat4.create();

            // mode bone → bypass lighting
            GL.uniform1i(uIsBone, 1);
            GL.uniform4fv(uColorBone, [0.0, 1.0, 1.0, 1.0]); // neon cyan

            GL.disable(GL.DEPTH_TEST);
            GL.depthMask(false);
            GL.enable(GL.BLEND);
            GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);

            drawObject(drawBuf, identityModel, null, GL.LINES, true);

            // reset state
            GL.uniform1i(uIsBone, 0);
            GL.depthMask(true);
            GL.disable(GL.BLEND);
            GL.enable(GL.DEPTH_TEST);
        }

        for (const c of this.children) c.drawHelper();
    }




}

export function makeModel(bone, offset = null) {
    if (offset) {
        const m = mat4.create();
        mat4.multiply(m, bone.getWorldMatrix(), offset);
        return m;
    } else {
        return bone.getWorldMatrix(); // langsung pakai worldMatrix
    }
}

// Helper untuk memanipulasi bone.localSpec dengan aman
export function addLocalRotation(bone, axis, angle) {
    // axis: "x"|"y"|"z" or [ax,ay,az] or {point,dir}
    // angle: radians
    if (!bone.localSpec) bone.localSpec = { translate: [0,0,0], rotate: [], scale: [1,1,1] };
    const rot = bone.localSpec.rotate ? bone.localSpec.rotate.slice() : [];
    rot.push({ axis, angle });
    bone.setLocalSpec({ rotate: rot });
}

export function setLocalRotationAxisAngle(bone, axisLabel, angle) {
    // axisLabel: 'x'|'y'|'z'
    // replace any existing single-axis rotations for that axis to avoid unlimited growth
    const cur = bone.localSpec.rotate || [];
    const filtered = cur.filter(r => !(r.axis === axisLabel));
    filtered.push({ axis: axisLabel, angle });
    bone.setLocalSpec({ rotate: filtered });
}

export function getAxisAngle(bone, axisLabel) {
    const cur = bone.localSpec.rotate || [];
    for (let i = cur.length - 1; i >= 0; --i) {
        const r = cur[i];
        if (r.axis === axisLabel) return r.angle;
    }
    return 0;
}
