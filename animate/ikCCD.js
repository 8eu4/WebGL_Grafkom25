// CCD IK solver (world-space target). Works on a chain from a start bone up to a root ancestor.
// Usage: solveCCD(character, endBoneName, targetWorldPos, {maxIter, threshold, clampAngle})
// - character.bones[name] must exist and bone.getWorldMatrix() must be up-to-date.

import { addLocalRotation } from '../bone.js';

function mat4ToPos(m) {
    return [m[12], m[13], m[14]];
}

function vec3Len(v) { return Math.hypot(v[0], v[1], v[2]); }
function vec3Sub(a,b){ return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
function vec3Dot(a,b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
function vec3Normalize(a){
    const l = vec3Len(a) || 1;
    return [a[0]/l, a[1]/l, a[2]/l];
}
function vec3Cross(a,b){
    return [
        a[1]*b[2]-a[2]*b[1],
        a[2]*b[0]-a[0]*b[2],
        a[0]*b[1]-a[1]*b[0]
    ];
}
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

export function buildChain(character, endBoneName, maxDepth = 20) {
    const chain = [];
    let node = character.bones[endBoneName];
    if (!node) return chain;
    // ascend until root or until maxDepth
    let depth = 0;
    while (node && depth < maxDepth) {
        chain.push(node);
        node = node.parent;
        depth++;
    }
    return chain; // [end, parent, grandparent, ... root]
}

export function solveCCD(character, endBoneName, targetWorldPos, options = {}) {
    const maxIter = options.maxIter || 12;
    const threshold = options.threshold || 1e-3;
    const clampAngle = options.clampAngle || (Math.PI); // not enforced by default

    // Make sure world matrices are current
    character.updateWorld();

    const chain = buildChain(character, endBoneName, 50);
    if (chain.length === 0) return false;

    // We'll operate from proximal -> distal? CCD usually iterates from parent of end to root.
    // For simplicity we'll iterate joints from chain[chain.length-1] (root) down to chain[0] (end)
    // But for rotation application we want to rotate joint to move end effector.

    for (let iter = 0; iter < maxIter; ++iter) {
        // recompute end effector world pos
        character.updateWorld();
        const endWorld = mat4ToPos(chain[0].worldMatrix);
        const distToTarget = vec3Len(vec3Sub(targetWorldPos, endWorld));
        if (distToTarget <= threshold) return true;

        // iterate joints from parent of end (chain[1]) up to root (chain[last])
        for (let j = 1; j < chain.length; j++) {
            const joint = chain[j];
            const jointPos = mat4ToPos(joint.worldMatrix);

            // recompute effector pos
            character.updateWorld();
            const effPos = mat4ToPos(chain[0].worldMatrix);

            const toEff = vec3Sub(effPos, jointPos);
            const toTarget = vec3Sub(targetWorldPos, jointPos);
            const lenEff = vec3Len(toEff) || 1;
            const lenTar = vec3Len(toTarget) || 1;

            const dirEff = [toEff[0]/lenEff, toEff[1]/lenEff, toEff[2]/lenEff];
            const dirTar = [toTarget[0]/lenTar, toTarget[1]/lenTar, toTarget[2]/lenTar];

            // if nearly colinear, skip
            const dot = clamp(vec3Dot(dirEff, dirTar), -1, 1);
            if (dot > 0.999999) continue;

            // rotation axis in world space
            let axis = vec3Cross(dirEff, dirTar);
            const axisLen = vec3Len(axis);
            if (axisLen < 1e-6) continue;
            axis = vec3Normalize(axis);

            // angle
            let angle = Math.acos(dot);
            // clamp a bit
            angle = clamp(angle, -clampAngle, clampAngle);

            // Apply rotation to joint.localSpec by adding a world-axis rotation converted to joint-local.
            // Simpler approach: apply rotation in world space by specifying axis as {point: jointPos, dir: axis}
            // This works because your createModelMatrix supports axis = {point, dir}
            addLocalRotation(joint, { point: jointPos, dir: axis }, angle);

            // update world matrices after applying
            character.updateWorld();
        }

        // check distance again
        character.updateWorld();
        const newEnd = mat4ToPos(chain[0].worldMatrix);
        const newDist = vec3Len(vec3Sub(targetWorldPos, newEnd));
        if (newDist <= threshold) return true;
    }

    // finished but didn't reach threshold
    return false;
}
