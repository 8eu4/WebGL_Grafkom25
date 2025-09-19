// animate/uiControls.js
// Unified UI: bone sliders + IK + timeline graph (per-bone tracks).
// Usage: initUI(human, animator)

import { setLocalRotationAxisAngle, getAxisAngle } from '../bone.js';
import { solveCCD } from '../animate/ikCCD.js';
import { PoseManager } from '../animate/poseManager.js';
import { TimelineAnimator } from '../animate/timelineAnim.js';

// small helper
function el(tag, attrs = {}, ...children) {
  const d = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'style') Object.assign(d.style, attrs[k]);
    else if (k.startsWith('on')) d.addEventListener(k.substring(2), attrs[k]);
    else d.setAttribute(k, attrs[k]);
  }
  for (const c of children) if (c !== null) d.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return d;
}

let autosaveTimer = null;

export function initUI(human, animator) {
  // container
  const container = el('div', { style: {
    position:'fixed', left:'10px', top:'10px', width:'420px', maxHeight:'90vh',
    overflow:'auto', background:'rgba(18,18,18,0.9)', color:'#eee', padding:'10px',
    borderRadius:'10px', fontFamily:'Inter,Arial,sans-serif', zIndex:99999
  }});
  document.body.appendChild(container);

  // header row
  const header = el('div', {}, el('b', {}, 'Scene / Timeline'));
  container.appendChild(header);

  // top buttons row
  const topRow = el('div', { style: { display:'flex', gap:'6px', marginTop:'8px' } });
  const btnSavePose = el('button', {}, '💾 Save Pose');
  const btnLoadPose = el('button', {}, '📂 Load Pose');
  const btnExport = el('button', {}, 'Export Anim');
  const btnImport = el('button', {}, 'Import Anim');
  topRow.appendChild(btnSavePose);
  topRow.appendChild(btnLoadPose);
  topRow.appendChild(btnExport);
  topRow.appendChild(btnImport);
  container.appendChild(topRow);

  // status
  const status = el('div', { style: { marginTop:'8px', minHeight:'18px', color:'#9f9' } }, 'Ready.');
  container.appendChild(status);

  // split area: left bone controls, right timeline canvas
  const split = el('div', { style: { display:'flex', marginTop:'8px', gap:'8px' } });
  container.appendChild(split);

  // left: bone controls + IK
  const left = el('div', { style: { width:'46%', overflow:'auto', maxHeight:'56vh' }});
  split.appendChild(left);

  // Bone controls header
  left.appendChild(el('div', { style:{ fontWeight:600 } }, 'Bone Controls (select bone to edit timeline)'));

  // Bone selector & controls container
  const boneSelect = el('select', { style: { width:'100%', marginTop:'6px' } });
  left.appendChild(boneSelect);

  const boneControls = el('div', { style: { marginTop:'8px' } });
  left.appendChild(boneControls);

  // IK controls
  left.appendChild(el('hr'));
  left.appendChild(el('div', { style:{ fontWeight:600 } }, 'IK Solver (CCD)'));
  const ikRow = el('div', { style:{ display:'flex', gap:'6px', marginTop:'6px' }});
  const ikEnd = el('input', { placeholder:'endBone e.g. leftHand', style:{ flex:'1' }});
  const ikTarget = el('input', { placeholder:'x,y,z', style:{ flex:'1' }});
  const ikBtn = el('button', {}, 'Solve');
  ikRow.appendChild(ikEnd); ikRow.appendChild(ikTarget); ikRow.appendChild(ikBtn);
  left.appendChild(ikRow);

  // auto-save toggle
  const autoRow = el('div', { style:{ marginTop:'8px' } },
    el('label', {}, 'Auto-save '),
    el('input', { type:'checkbox', id:'ui_autosave' })
  );
  left.appendChild(autoRow);
  document.getElementById('ui_autosave').checked = true;

  // right: timeline panel
  const right = el('div', { style: { width:'54%' }});
  split.appendChild(right);

  right.appendChild(el('div', { style:{ fontWeight:600 } }, 'Timeline'));

  // timeline controls row
  const trow = el('div', { style:{ display:'flex', gap:'6px', marginTop:'6px' } });
  const timeInput = el('input', { type:'number', value:'1.0', step:'0.1', style:{ width:'80px' }});
  const addKF = el('button', {}, '➕ Add Keyframe');
  const playBtn = el('button', {}, '▶ Play');
  const stopBtn = el('button', {}, '⏹ Stop');
  trow.appendChild(el('div', {}, 'Time(s): ')); trow.appendChild(timeInput);
  trow.appendChild(addKF); trow.appendChild(playBtn); trow.appendChild(stopBtn);
  right.appendChild(trow);

  // speed, loop
  const trow2 = el('div', { style:{ display:'flex', gap:'8px', marginTop:'6px', alignItems:'center'}});
  const speedInput = el('input', { type:'number', value:'1.0', step:'0.1', style:{ width:'70px' }});
  const loopChk = el('input', { type:'checkbox' });
  trow2.appendChild(el('div', {}, 'Speed:')); trow2.appendChild(speedInput);
  trow2.appendChild(el('div', {}, 'Loop:')); trow2.appendChild(loopChk);
  right.appendChild(trow2);

  // timeline canvas: will draw tracks
  const canvasWrap = el('div', { style:{ marginTop:'8px', background:'#111', borderRadius:'6px', padding:'6px' }});
  const timelineCanvas = el('canvas', { width:800, height:260, style:{ width:'100%', height:'200px', display:'block', cursor:'crosshair' }});
  canvasWrap.appendChild(timelineCanvas);
  right.appendChild(canvasWrap);

  // scrub slider and list
  const scrub = el('input', { type:'range', min:0, max:1, step:0.001, value:0, style:{ width:'100%', marginTop:'6px' }});
  right.appendChild(scrub);
  const kfList = el('div', { id:'kfList', style:{ marginTop:'6px', maxHeight:'120px', overflow:'auto', background:'rgba(255,255,255,0.02)', padding:'6px', borderRadius:'6px' }});
  right.appendChild(kfList);

  // --- populate bone selector and create slider UI per bone
  const boneNames = Object.keys(human.bones || {}).sort();
  let selectedBone = boneNames.length ? boneNames[0] : null;

  // mapping bone->control elements for updates
  const boneControlsMap = {};

  function buildBoneControls() {
    boneSelect.innerHTML = '';
    for (const n of boneNames) {
      boneSelect.appendChild(el('option', { value:n }, n));
    }
    // create control panels
    boneControls.innerHTML = '';
    for (const n of boneNames) {
      const panel = el('div', { style:{ padding:'6px', marginBottom:'6px', background:'rgba(255,255,255,0.02)', borderRadius:'6px' }});
      const title = el('div', { style:{ fontWeight:600 } }, n);
      panel.appendChild(title);

      // sliders for X/Y/Z rotation (deg)
      ['x','y','z'].forEach(ax => {
        const row = el('div', { style:{ display:'flex', gap:'6px', alignItems:'center', marginTop:'6px' }});
        const lab = el('div', { style:{ width:'20px' } }, ax.toUpperCase());
        const range = el('input', { type:'range', min:-180, max:180, value:0, style:{ flex:1 }});
        const num = el('input', { type:'number', value:0, style:{ width:'60px' }});
        const reset = el('button', {}, 'R');
        row.appendChild(lab); row.appendChild(range); row.appendChild(num); row.appendChild(reset);
        panel.appendChild(row);

        function applyVal(vDeg) {
          const bone = human.bones[n];
          const rad = (vDeg||0) * Math.PI / 180;
          setLocalRotationAxisAngle(bone, ax, rad);
          human.updateWorld();
          doAutoSavePoseDebounced();
        }
        range.oninput = (e) => { num.value = e.target.value; applyVal(parseFloat(e.target.value)); };
        num.onchange = (e) => { range.value = e.target.value; applyVal(parseFloat(e.target.value)); };
        reset.onclick = ()=> { range.value = 0; num.value = 0; applyVal(0); };

        boneControlsMap[n] = boneControlsMap[n] || { sliders:{} };
        boneControlsMap[n].sliders[ax] = { range, num };
      });
      boneControls.appendChild(panel);
    }
    // select panel visibility
    updateBonePanelVisibility();
  }

  function updateBonePanelVisibility() {
    const children = boneControls.children;
    for (let i=0;i<children.length;i++){
      const name = boneNames[i];
      children[i].style.display = (name === boneSelect.value) ? 'block' : 'none';
    }
  }

  boneSelect.onchange = () => { selectedBone = boneSelect.value; updateBonePanelVisibility(); drawTimeline(); };

  buildBoneControls();

  // IK button
  ikBtn.onclick = () => {
    const endName = ikEnd.value.trim() || selectedBone;
    const parts = (ikTarget.value || '').split(',').map(s=>parseFloat(s.trim()));
    if (!endName || parts.length !== 3 || parts.some(isNaN)) {
      showStatus('Provide end bone and numeric target x,y,z', true);
      return;
    }
    if (!human.bones[endName]) { showStatus('Unknown bone '+endName, true); return; }
    const ok = solveCCD(human, endName, parts, { maxIter:18, threshold:1e-3 });
    human.updateWorld();
    showStatus(ok ? 'IK converged' : 'IK finished (no converge)');
    doAutoSavePoseDebounced();
    refreshScrubAndList();
    drawTimeline();
  };

  // Auto save debounce
  function doAutoSavePoseDebounced() {
    const c = document.getElementById('ui_autosave');
    if (!c || !c.checked) return;
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(()=> {
      const name = `autosave_${Date.now()}`;
      PoseManager.savePose(human, name);
      showStatus('Auto-saved pose');
    }, 600);
  }

  // Show status text (error if err=true)
  let statusTimer = null;
  function showStatus(msg, err=false, ttl=1500) {
    status.style.color = err ? '#f88' : '#9f9';
    status.textContent = msg;
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(()=> { status.textContent = 'Ready.'; status.style.color = '#9f9'; }, ttl);
  }

  // --- Timeline canvas logic ---
  const ctx = timelineCanvas.getContext('2d');
  let canvasW = timelineCanvas.width = 900;
  let canvasH = timelineCanvas.height = 260;
  // rendering configuration
  const trackHeight = 18;
  const trackGap = 6;
  const leftMargin = 80;
  const rightMargin = 20;
  const timeScale = { // time->px conversion dynamic: scale = px per second
    pxPerSec: 80, // default
    setScaleForDuration(dur) {
      // aim to fit approx 8-12s width based on canvas
      const avail = canvasW - leftMargin - rightMargin;
      if (dur <= 0) { this.pxPerSec = 80; return; }
      // choose so that dur spans 70% of canvas: pxPerSec = avail*0.7 / dur
      this.pxPerSec = Math.max(20, (avail * 0.75) / dur);
    },
    timeToX(t){ return leftMargin + t * this.pxPerSec; },
    xToTime(x){ return Math.max(0, (x - leftMargin) / this.pxPerSec); }
  };

  function resizeCanvasToDisplaySize() {
    // sync canvas pixel ratio
    const ratio = window.devicePixelRatio || 1;
    const displayW = timelineCanvas.clientWidth * ratio;
    const displayH = timelineCanvas.clientHeight * ratio;
    if (timelineCanvas.width !== displayW || timelineCanvas.height !== displayH) {
      timelineCanvas.width = displayW;
      timelineCanvas.height = displayH;
      canvasW = timelineCanvas.width;
      canvasH = timelineCanvas.height;
    }
  }

  // track list = boneNames; compute track positions
  function drawTimeline() {
    resizeCanvasToDisplaySize();
    ctx.clearRect(0,0,canvasW,canvasH);
    // background
    ctx.fillStyle = '#0b0b0b';
    ctx.fillRect(0,0,canvasW,canvasH);

    const tracks = boneNames;
    const dur = Math.max(animator.getDuration(), 1.0);
    timeScale.setScaleForDuration(dur);

    // draw header time ruler
    ctx.fillStyle = '#888';
    ctx.font = `${12 * (window.devicePixelRatio||1)}px Arial`;
    const availW = canvasW - leftMargin - rightMargin;
    const numTicks = Math.ceil((availW / timeScale.pxPerSec));
    for (let i=0;i<=numTicks;i++){
      const t = i;
      const x = timeScale.timeToX(t);
      ctx.fillStyle = '#444';
      ctx.fillRect(x, 0, 1, 8 * (window.devicePixelRatio||1));
      ctx.fillStyle = '#aaa';
      ctx.fillText(t.toFixed(0)+'s', x+3, 12 * (window.devicePixelRatio||1));
    }

    // draw tracks
    for (let i=0;i<tracks.length;i++){
      const y = 28 + i * (trackHeight + trackGap);
      // track label
      ctx.fillStyle = (tracks[i] === selectedBone) ? '#fff' : '#9a9a9a';
      ctx.fillText(tracks[i], 6, y + trackHeight - 3);

      // track background
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(leftMargin, y, canvasW - leftMargin - rightMargin, trackHeight);

      // keyframes for this bone
      const boneKF = animator.keyframes.map((kf, idx) => ({ idx, time:kf.time, poseName:kf.poseName }))
        .filter(kf => {
          // check if stored pose contains this bone
          const raw = localStorage.getItem(`pose_${kf.poseName}`);
          if (!raw) return false;
          try { const p = JSON.parse(raw); return !!p[tracks[i]]; } catch(e){return false;}
        });

      for (const kf of boneKF) {
        const x = timeScale.timeToX(kf.time);
        // dot
        ctx.beginPath();
        ctx.fillStyle = '#ff8';
        ctx.arc(x, y + trackHeight/2, 6 * (window.devicePixelRatio||1), 0, Math.PI*2);
        ctx.fill();
        ctx.closePath();
        // store clickable rect: we'll test by coordinates in mouse handling
      }
    }

    // draw current time marker if playing or scrubbed
    const durActual = Math.max(animator.getDuration(), 1.0);
    let curT = 0;
    if (animator.isPlaying) {
      const now = performance.now()/1000;
      curT = (now - animator.startRealTime) * animator.playSpeed + animator.startOffset;
      if (animator.loop && durActual>0) curT = ((curT % durActual)+durActual)%durActual;
      curT = Math.max(0, Math.min(durActual, curT));
    } else {
      // derive curT from scrub value
      const s = parseFloat(scrub.value) || 0;
      curT = s * durActual;
    }
    const curX = timeScale.timeToX(curT);
    ctx.strokeStyle = 'rgba(255,80,80,0.9)';
    ctx.beginPath();
    ctx.moveTo(curX, 0);
    ctx.lineTo(curX, canvasH);
    ctx.stroke();
  }

  drawTimeline();

  // --- mouse interaction on timeline: add/move/delete keyframes per selected bone ---
  let draggingKF = null; // {kfIndex}
  let draggingCanvas = false;
  timelineCanvas.addEventListener('dblclick', (ev) => {
    // add keyframe at click time for selected bone (use current pose snapshot)
    const rect = timelineCanvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (window.devicePixelRatio||1);
    const t = timeScale.xToTime(x);
    // add on animator: add keyframe stores full pose
    const poseName = animator.addKeyframe(t);
    refreshScrubAndList();
    drawTimeline();
    showStatus(`Added keyframe @ ${t.toFixed(3)}s`);
  });

  timelineCanvas.addEventListener('mousedown', (ev) => {
    draggingCanvas = true;
    const rect = timelineCanvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (window.devicePixelRatio||1);
    const y = (ev.clientY - rect.top) * (window.devicePixelRatio||1);
    // detect if clicked on any keyframe dot
    const hit = hitTestKeyframe(x,y);
    if (hit) {
      draggingKF = hit; // { idx, boneName }
      timelineCanvas.style.cursor = 'grabbing';
    } else {
      // start scrub drag: set scrub value by click position
      const t = timeScale.xToTime(x);
      const dur = Math.max(animator.getDuration(), 1.0);
      const s = dur > 0 ? (t / dur) : 0;
      scrub.value = s;
      animator.seek(t);
      drawTimeline();
    }
  });

  window.addEventListener('mouseup', (ev) => {
    if (draggingKF) {
      // finish drag -> show status and save that keyframe's new time
      showStatus('Keyframe moved & saved');
      refreshScrubAndList();
    }
    draggingKF = null;
    draggingCanvas = false;
    timelineCanvas.style.cursor = 'crosshair';
  });

  timelineCanvas.addEventListener('mousemove', (ev) => {
    if (!draggingKF && !draggingCanvas) return;
    const rect = timelineCanvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (window.devicePixelRatio||1);
    const t = timeScale.xToTime(x);
    if (draggingKF) {
      // move keyframe index time to t
      const kfIdx = draggingKF.idx;
      if (kfIdx >= 0 && kfIdx < animator.keyframes.length) {
        animator.keyframes[kfIdx].time = Math.max(0, t);
        animator.keyframes.sort((a,b)=>a.time-b.time);
        refreshScrubAndList();
        drawTimeline();
      }
    } else {
      // scrubbing preview
      const dur = Math.max(animator.getDuration(), 1.0);
      const s = dur>0 ? (t/dur) : 0;
      scrub.value = clamp(s,0,1);
      animator.seek(t);
      drawTimeline();
    }
  });

  // hit-test keyframe dot: returns {idx, boneName} for first match
  function hitTestKeyframe(px, py) {
    const tracks = boneNames;
    for (let i=0;i<tracks.length;i++){
      const y = 28 + i * (trackHeight + trackGap);
      const bone = tracks[i];
      for (let k=0;k<animator.keyframes.length;k++){
        const kf = animator.keyframes[k];
        const raw = localStorage.getItem(`pose_${kf.poseName}`);
        if (!raw) continue;
        try{
          const pose = JSON.parse(raw);
          if (!pose[bone]) continue;
        } catch(e){ continue; }
        const x = timeScale.timeToX(kf.time);
        const dy = py - (y + trackHeight/2);
        const dx = px - x;
        const r = 8 * (window.devicePixelRatio||1);
        if (dx*dx + dy*dy <= r*r) return { idx:k, boneName:bone };
      }
    }
    return null;
  }

  // helper: refresh scrub range & keyframe list UI
  function refreshScrubAndList() {
    const dur = Math.max(animator.getDuration(), 1.0);
    scrub.max = 1;
    // rebuild list
    kfList.innerHTML = '';
    animator.keyframes.forEach((kf, idx) => {
      const row = el('div', { style:{ display:'flex', justifyContent:'space-between', marginBottom:'4px', alignItems:'center' }});
      const leftText = `${idx}: ${kf.time.toFixed(3)}s`;
      const leftSpan = el('div', {}, leftText);
      const btns = el('div', {});
      const go = el('button', {}, 'Go');
      const del = el('button', {}, 'Del');
      btns.appendChild(go); btns.appendChild(del);
      row.appendChild(leftSpan); row.appendChild(btns);
      kfList.appendChild(row);
      go.onclick = ()=> { animator._applyPoseByIndex(idx); drawTimeline(); showStatus(`Jumped to ${kf.time.toFixed(3)}s`); };
      del.onclick = ()=> { animator.removeKeyframe(idx); refreshScrubAndList(); drawTimeline(); showStatus(`Deleted keyframe ${idx}`); };
    });
    // update canvas scale
    drawTimeline();
  }

  // connect timeline controls
  addKF.onclick = ()=> {
    const t = parseFloat(timeInput.value) || 0;
    const name = animator.addKeyframe(t);
    refreshScrubAndList();
    drawTimeline();
    showStatus(`Added keyframe ${name} @ ${t}s`);
  };
  playBtn.onclick = ()=> {
    if (animator.keyframes.length < 2) { showStatus('Need at least 2 keyframes to play', true); return; }
    animator.play(0);
    animator.playSpeed = parseFloat(speedInput.value)||1.0;
    animator.loop = !!loopChk.checked;
    showStatus('Playing');
  };
  stopBtn.onclick = ()=> { animator.stop(); showStatus('Stopped'); };

  // scrub change -> seek
  scrub.oninput = ()=> {
    const s = parseFloat(scrub.value) || 0;
    const dur = Math.max(animator.getDuration(), 1.0);
    const t = s * dur;
    animator.seek(t);
    drawTimeline();
    showStatus(`Scrub ${t.toFixed(3)}s`);
  };

  // export / import animations (json of animator.keyframes + poses)
  btnExport.onclick = () => {
    const data = { keyframes: animator.keyframes, poses: {} };
    for (const kf of animator.keyframes) {
      const raw = localStorage.getItem(`pose_${kf.poseName}`);
      if (raw) data.poses[kf.poseName] = JSON.parse(raw);
    }
    const txt = JSON.stringify(data);
    const blob = new Blob([txt], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'animation.json'; a.click();
    URL.revokeObjectURL(url);
    showStatus('Exported animation JSON');
  };
  btnImport.onclick = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = (e) => {
      const f = inp.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const obj = JSON.parse(r.result);
          // store poses to localStorage and rebuild keyframes
          animator.keyframes = [];
          for (const kf of obj.keyframes || []) {
            // ensure pose saved
            const pn = kf.poseName;
            if (obj.poses && obj.poses[pn]) {
              localStorage.setItem(`pose_${pn}`, JSON.stringify(obj.poses[pn]));
            }
            animator.keyframes.push({ time: kf.time, poseName: pn });
          }
          animator.keyframes.sort((a,b)=>a.time-b.time);
          refreshScrubAndList();
          drawTimeline();
          showStatus('Imported animation');
        } catch(err) {
          showStatus('Invalid JSON', true);
        }
      };
      r.readAsText(f);
    };
    inp.click();
  };

  // Save/Load Pose (top)
  btnSavePose.onclick = () => {
    const name = `pose_${Date.now()}`;
    PoseManager.savePose(human, name);
    showStatus(`Pose saved ${name}`);
  };
  btnLoadPose.onclick = () => {
    const list = PoseManager.listPoses();
    if (!list.length) { showStatus('No saved pose', true); return; }
    const name = list[list.length-1];
    PoseManager.loadPose(human, name);
    showStatus(`Pose loaded ${name}`);
    refreshScrubAndList();
    drawTimeline();
  };

  // update bone sliders during playback & on pose load
  function syncSlidersWithBone() {
    for (const name of boneNames) {
      const bone = human.bones[name];
      if (!bone) continue;
      // attempt to fetch axis angle values for x,y,z (we store rotate array single axis)
      const get = (axis) => {
        try { return (getAxisAngle(bone, axis) * 180 / Math.PI).toFixed(0); } catch(e){ return 0; }
      };
      const map = boneControlsMap[name].sliders;
      map.x.range.value = map.x.num.value = get('x');
      map.y.range.value = map.y.num.value = get('y');
      map.z.range.value = map.z.num.value = get('z');
    }
  }

  // update loop: while playing update scrub and sliders
  function uiTick() {
    requestAnimationFrame(uiTick);
    if (animator.isPlaying) {
      // update scrub position
      const dur = Math.max(animator.getDuration(), 1.0);
      const now = performance.now()/1000;
      let t = (now - animator.startRealTime) * animator.playSpeed + animator.startOffset;
      if (animator.loop && dur>0) t = ((t % dur)+dur)%dur;
      t = Math.max(0, Math.min(dur, t));
      scrub.value = dur>0 ? (t/dur) : 0;
      // animator.update() called from main render loop; we only sync sliders here
      syncSlidersWithBone();
      drawTimeline();
    }
  }
  uiTick();

  // initial refresh
  refreshScrubAndList();
  drawTimeline();
  updateBonePanelVisibility();

  // expose some helpers
  window.__APP_UI__ = { showStatus, refreshScrubAndList, drawTimeline };

  // utility clamp
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
}
