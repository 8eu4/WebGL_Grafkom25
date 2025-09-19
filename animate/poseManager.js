// PoseManager.js
// depends on global gl-matrix (mat4, quat)

export const PoseManager = {
  savePose,
  loadPose,
  listPoses,
  deletePose
};

function poseKey(name) { return `pose_${name}`; }

function savePose(character, name = 'pose_default') {
  // ensure matrices up-to-date
  if (character.updateWorld) character.updateWorld();
  const out = {};
  for (const [boneName, bone] of Object.entries(character.bones || {})) {
    const m = bone.localMatrix || mat4.create();
    const t = [0,0,0], s = [1,1,1], q = [0,0,0,1];
    mat4.getTranslation(t, m);
    mat4.getScaling(s, m);
    mat4.getRotation(q, m);
    out[boneName] = { translate: t, scale: s, rotation: q };
  }
  localStorage.setItem(poseKey(name), JSON.stringify(out));
  return true;
}

function loadPose(character, name = 'pose_default') {
  const raw = localStorage.getItem(poseKey(name));
  if (!raw) return false;
  const data = JSON.parse(raw);
  for (const [boneName, bone] of Object.entries(character.bones || {})) {
    const p = data[boneName];
    if (!p) continue;
    // convert quaternion to axis+angle
    const q = p.rotation || [0,0,0,1];
    const qw = q[3];
    let angle = 2 * Math.acos(clamp(qw, -1, 1));
    let axis = [1, 0, 0];
    const s = Math.sqrt(1 - qw * qw);
    if (s > 1e-6) {
      axis = [ q[0] / s, q[1] / s, q[2] / s ];
    }
    // set localSpec: translate, scale, rotate as single axis-angle
    bone.setLocalSpec({
      translate: (p.translate || [0,0,0]).slice(),
      scale: (p.scale || [1,1,1]).slice(),
      rotate: [{ axis: axis, angle: angle }]
    });
  }
  if (character.updateWorld) character.updateWorld();
  return true;
}

function listPoses() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('pose_')) keys.push(k.substring(5));
  }
  return keys.sort();
}

function deletePose(name) {
  localStorage.removeItem(poseKey(name));
  return true;
}

function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
