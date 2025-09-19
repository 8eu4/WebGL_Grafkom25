// TimelineAnimator.js
// Uses PoseManager (above). Depends on global gl-matrix (quat, vec3)

import { PoseManager } from '../animate/poseManager.js';

export class TimelineAnimator {
  constructor(character, opts = {}) {
    this.character = character;
    this.keyframes = []; // { time: seconds, poseName: string }
    this.isPlaying = false;
    this.startRealTime = 0; // performance.now()/1000 when play started
    this.startOffset = 0;   // timeline time at play start (for resume)
    this.loop = !!opts.loop;
    this.playSpeed = opts.playSpeed || 1.0;
  }

  // add a keyframe at `timeSec`
  addKeyframe(timeSec) {
    // make unique name
    const poseName = `kf_${Date.now()}_${timeSec.toFixed(3)}`;
    PoseManager.savePose(this.character, poseName);
    this.keyframes.push({ time: parseFloat(timeSec), poseName });
    this.keyframes.sort((a,b) => a.time - b.time);
    return poseName;
  }

  removeKeyframe(index) {
    if (index < 0 || index >= this.keyframes.length) return false;
    // optionally delete stored pose
    // PoseManager.deletePose(this.keyframes[index].poseName);
    this.keyframes.splice(index,1);
    return true;
  }

  // play from current timeline time (or 0)
  play(fromTime = 0) {
    this.isPlaying = true;
    this.startRealTime = performance.now() / 1000;
    this.startOffset = fromTime;
  }

  stop() {
    this.isPlaying = false;
  }

  // returns duration (last keyframe time) or 0
  getDuration() {
    if (!this.keyframes.length) return 0;
    return this.keyframes[this.keyframes.length - 1].time;
  }

  // set elapsed timeline time (for scrubbing)
  seek(t) {
    // apply immediate pose at time t (without playing)
    this._applyAtTime(t);
  }

  // call every frame in render loop
  update() {
    if (!this.isPlaying) return;
    const now = performance.now() / 1000;
    const elapsed = (now - this.startRealTime) * this.playSpeed + this.startOffset;
    const dur = this.getDuration();
    if (dur <= 0) { this.stop(); return; }
    let t = elapsed;
    if (this.loop) {
      t = ((t % dur) + dur) % dur;
    } else {
      if (t > dur) { this._applyAtTime(dur); this.stop(); return; }
      if (t < 0) { this._applyAtTime(0); return; }
    }
    this._applyAtTime(t);
  }

  _applyAtTime(t) {
    if (this.keyframes.length === 0) return;
    // find surrounding keyframes
    let i1 = 0;
    while (i1 < this.keyframes.length && this.keyframes[i1].time <= t) i1++;
    // i1 is first keyframe with time > t
    const idxNext = i1;
    const idxPrev = i1 - 1;

    if (idxPrev < 0) {
      // before first -> apply first
      this._applyPoseByIndex(0);
      return;
    }
    if (idxNext >= this.keyframes.length) {
      // after last -> apply last
      this._applyPoseByIndex(this.keyframes.length - 1);
      return;
    }
    const kfA = this.keyframes[idxPrev];
    const kfB = this.keyframes[idxNext];
    const localT = (t - kfA.time) / (kfB.time - kfA.time);

    // load poses from storage
    const rawA = localStorage.getItem(`pose_${kfA.poseName}`);
    const rawB = localStorage.getItem(`pose_${kfB.poseName}`);
    if (!rawA || !rawB) return;
    const poseA = JSON.parse(rawA);
    const poseB = JSON.parse(rawB);

    // for each bone interpolate translate, scale and quaternion slerp
    for (const boneName of Object.keys(this.character.bones || {})) {
      const bone = this.character.bones[boneName];
      const pa = poseA[boneName];
      const pb = poseB[boneName];
      if (!pa || !pb) continue;

      // translate lerp
      const tr = [
        pa.translate[0] * (1 - localT) + pb.translate[0] * localT,
        pa.translate[1] * (1 - localT) + pb.translate[1] * localT,
        pa.translate[2] * (1 - localT) + pb.translate[2] * localT
      ];

      // scale lerp
      const sc = [
        pa.scale[0] * (1 - localT) + pb.scale[0] * localT,
        pa.scale[1] * (1 - localT) + pb.scale[1] * localT,
        pa.scale[2] * (1 - localT) + pb.scale[2] * localT
      ];

      // quaternion slerp
      const qa = pa.rotation || [0,0,0,1];
      const qb = pb.rotation || [0,0,0,1];
      const outQ = quat.create();
      quat.slerp(outQ, qa, qb, localT);

      // convert quaternion -> axis-angle
      const qw = outQ[3];
      let angle = 2 * Math.acos(clamp(qw, -1, 1));
      let axis = [1,0,0];
      const s = Math.sqrt(1 - qw*qw);
      if (s > 1e-6) axis = [ outQ[0]/s, outQ[1]/s, outQ[2]/s ];

      // apply to bone
      bone.setLocalSpec({
        translate: tr,
        scale: sc,
        rotate: [{ axis: axis, angle: angle }]
      });
    }
    // apply update to world matrices once
    if (this.character.updateWorld) this.character.updateWorld();
  }

  _applyPoseByIndex(idx) {
    if (idx < 0 || idx >= this.keyframes.length) return;
    const kf = this.keyframes[idx];
    const raw = localStorage.getItem(`pose_${kf.poseName}`);
    if (!raw) return;
    const pose = JSON.parse(raw);
    for (const boneName of Object.keys(this.character.bones || {})) {
      const p = pose[boneName];
      if (!p) continue;
      const q = p.rotation || [0,0,0,1];
      const qw = q[3];
      let angle = 2 * Math.acos(clamp(qw, -1, 1));
      let axis = [1,0,0];
      const s = Math.sqrt(1 - qw*qw);
      if (s > 1e-6) axis = [ q[0]/s, q[1]/s, q[2]/s ];
      this.character.bones[boneName].setLocalSpec({
        translate: (p.translate||[0,0,0]).slice(),
        scale: (p.scale||[1,1,1]).slice(),
        rotate: [{ axis: axis, angle: angle }]
      });
    }
    if (this.character.updateWorld) this.character.updateWorld();
  }
}

function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
