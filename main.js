import { HumanCharacter } from "./process/Human.js";
import { mime_jr } from "./process/mime_jr.js";


// NOTE GLOBAL VARIABLE KE SELURUH FILE
export let GL = null;
export let attribs = null;
export let proj = null;
export let view = null;
export let uMVP = null;
export let uColor = null;
export let uModel = null;
export let uNormalMat = null;
export let uIsBone = null;
export let uColorBone = null;

let camera = null;
let uViewPos = null;
let CANVAS = null;

function main() {
    CANVAS = document.getElementById("mycanvas");

    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;

    /*===================== GET WEBGL CONTEXT ===================== */
    /** @type {WebGLRenderingContext} */
    // var GL;
    try {
        GL = CANVAS.getContext("webgl", { antialias: true });
    } catch (e) {
        alert("WebGL context cannot be initialized");
        return false;
    }
    otherFactor();

    // ---------- Mesh, Transform, Bone, Align mesh,  ----------

    // TODO Make HUMAN Object
    const human = new HumanCharacter();

    // const mime_jr1 = new mime_jr();

    // Make other object here!
    //..

    // ---------- Render Loop ----------
    GL.clearColor(0.0, 0.0, 0.0, 0.0);
    GL.enable(GL.DEPTH_TEST);


    function animate(time) {
        // CAMERA
        cameraUpdate();


        // -------------- update bone localSpecs ----------------
        // TODO
        // Animate HUMAN
        human.animate(time)
        // mime_jr1.animate(time);

        // Animate here!
        //..

        // ------------------------ Draw Object -------------
        // TODO
        // Draw HUMAN
        human.drawObject();
        // mime_jr1.drawObject();

        // Draw here!
        //..


        // REVIEW --------------- Draw bone ----------------
        // human.root.drawHelper();
        // mime_jr1.root.drawHelper(); // dibuang jika tidak mau lihat bone

        GL.flush();
        requestAnimationFrame(animate);
    }
    animate(0);
}
window.addEventListener("load", main);


// Camera, Shaders, Lighting
function otherFactor() {
    // REVIEW ---------- Camera ----------
    camera = {
        yaw: 0,       // rotasi horizontal (sekitar Y axis)
        pitch: Math.PI / 30,     // rotasi vertical (sekitar X axis)
        radius: 10.0,   // jarak kamera dari target
        target: [0, 0, 0] // pusat pandangan
    };
    let isDragging = false;
    let lastX = 0, lastY = 0;
    CANVAS.addEventListener("mousedown", (e) => {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
    });
    CANVAS.addEventListener("mouseup", () => {
        isDragging = false;
    });
    CANVAS.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;

        if (e.buttons === 1 && e.shiftKey) {
            // --- PAN MODE ---
            const panSpeed = 0.002 * camera.radius;

            // hitung basis vektor relatif kamera
            const cosPitch = Math.cos(camera.pitch);
            const sinPitch = Math.sin(camera.pitch);
            const cosYaw = Math.cos(camera.yaw);
            const sinYaw = Math.sin(camera.yaw);

            const right = [cosYaw, 0, -sinYaw];
            const up = [-sinPitch * sinYaw, cosPitch, -sinPitch * cosYaw];

            // geser target
            camera.target[0] -= dx * panSpeed * right[0] - dy * panSpeed * up[0];
            camera.target[1] -= dx * panSpeed * right[1] - dy * panSpeed * up[1];
            camera.target[2] -= dx * panSpeed * right[2] - dy * panSpeed * up[2];
        } else if (e.buttons === 1) {
            // --- ORBIT MODE ---
            camera.yaw -= dx * 0.005;
            camera.pitch += dy * 0.005;
            camera.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, camera.pitch));
        }
    });
    CANVAS.addEventListener("wheel", (e) => {
        camera.radius += e.deltaY * 0.01;
        // camera.radius = Math.max(1.0, Math.min(20.0, camera.radius));
    });

    // ---------- Shaders ----------
    const vsSource = `
        attribute vec3 position;
        attribute vec3 normal;
        attribute vec2 uv;

        uniform bool uIsBone;
        uniform mat4 uMVP;
        uniform mat4 uModel;     // buat posisi dunia
        uniform mat3 uNormalMat; // transform normal
        uniform vec3 uLightDir;
        
        varying vec3 vNormal;
        varying vec3 vPos;
        varying vec2 vUV;

        void main(void) {
            gl_Position = uMVP * vec4(position, 1.0);
            if (uIsBone) {
                // Bone/joint: ga perlu normal/posisi → kasih dummy biar ga error
                vNormal = vec3(0.0);
                vPos    = vec3(0.0);
                vUV     = vec2(0.0);
            } else {
                // Mesh biasa → tetap pake lighting data
                vNormal = normalize(uNormalMat * normal);
                vPos    = (uModel * vec4(position, 1.0)).xyz;
                vUV     = uv;
            }
        }`;

    const fsSource = `

        precision mediump float;

        uniform bool uIsBone;        // apakah ini bone helper? 0 = mesh, 1 = bone
        uniform vec4 uColorBone;     // warna RGBA bone
        
        uniform vec3 uColor;      // warna mesh biasa
        uniform vec3 uLightDir;   // arah cahaya (world space)
        uniform vec3 uAmbient;    // warna ambient
        uniform vec3 uLightColor; // warna cahaya utama
        uniform vec3 uViewPos;    // posisi kamera (eye)
        
        varying vec3 vNormal;
        varying vec3 vPos;
        varying vec2 vUV;

        void main(void) {
            if (uIsBone) {
                gl_FragColor = uColorBone; // bypass lighting
                return;
            }

            vec3 N = normalize(vNormal);
            vec3 L = normalize(-uLightDir);
            vec3 V = normalize(uViewPos - vPos);
            vec3 R = reflect(-L, N);

            vec3 ambient = uAmbient * uColor;
            float diff = max(dot(N, L), 0.0);
            vec3 diffuse = diff * uLightColor * uColor;
            float spec = pow(max(dot(R, V), 0.0), 32.0);
            vec3 specular = spec * uLightColor;

            vec3 result = ambient + diffuse + specular;
            gl_FragColor = vec4(result, 1.0);
        }`;

    function compile(src, type) {
        const sh = GL.createShader(type);
        GL.shaderSource(sh, src);
        GL.compileShader(sh);
        if (!GL.getShaderParameter(sh, GL.COMPILE_STATUS)) {
            throw GL.getShaderInfoLog(sh);
        }
        return sh;
    }

    const prog = GL.createProgram();
    GL.attachShader(prog, compile(vsSource, GL.VERTEX_SHADER));
    GL.attachShader(prog, compile(fsSource, GL.FRAGMENT_SHADER));
    GL.linkProgram(prog);
    GL.useProgram(prog);

    GL.enable(GL.DEPTH_TEST);
    GL.enable(GL.BLEND);
    GL.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);


    // ---------- Attributes & Uniforms ----------
    attribs = {
        position: GL.getAttribLocation(prog, "position"),
        normal: GL.getAttribLocation(prog, "normal"),
        uv: GL.getAttribLocation(prog, "uv")
    };

    // REVIEW CAHAYA
    uModel = GL.getUniformLocation(prog, "uModel");
    uNormalMat = GL.getUniformLocation(prog, "uNormalMat");
    const uLightDir = GL.getUniformLocation(prog, "uLightDir");
    const uAmbient = GL.getUniformLocation(prog, "uAmbient");
    const uLightColor = GL.getUniformLocation(prog, "uLightColor");
    const uViewPos = GL.getUniformLocation(prog, "uViewPos");

    // arah cahaya dari kanan-atas-depan
    function sphericalToDir(azimuth, elevation) {
        return [
            Math.cos(elevation) * Math.cos(azimuth),
            Math.sin(elevation),
            Math.cos(elevation) * Math.sin(azimuth)
        ];
    }
    const az = Math.PI / 2;    // ..° horizontal
    const el = Math.PI / -1.5;    // ..° vertical
    const lightDir = sphericalToDir(az, el);
    GL.uniform3fv(uLightDir, lightDir);
    GL.uniform3fv(uAmbient, [0.5, 0.5, 0.5]);
    GL.uniform3fv(uLightColor, [1.0, 1.0, 1.0]); // putih

    uMVP = GL.getUniformLocation(prog, "uMVP");
    uColor = GL.getUniformLocation(prog, "uColor");

    uIsBone = GL.getUniformLocation(prog, "uIsBone");
    uColorBone = GL.getUniformLocation(prog, "uColorBone");

    if (uIsBone !== null) GL.uniform1i(uIsBone, 0);
    if (uColorBone !== null) GL.uniform4fv(uColorBone, [0.0, 1.0, 1.0, 0.9]); // default neon cyan

    // ---------- field of view, aspect ratio, near plane, far plane ----------
    proj = mat4.create();
    mat4.perspective(proj, 45 * Math.PI / 180, CANVAS.width / CANVAS.height, 0.1, 100);
}

//Dont mind this!
function cameraUpdate() {
    const eye = [
        camera.target[0] + camera.radius * Math.cos(camera.pitch) * Math.sin(camera.yaw),
        camera.target[1] + camera.radius * Math.sin(camera.pitch),
        camera.target[2] + camera.radius * Math.cos(camera.pitch) * Math.cos(camera.yaw)
    ];

    const up = [0, 1, 0];

    view = mat4.create();
    mat4.lookAt(view, eye, camera.target, up);

    // update posisi kamera 
    GL.uniform3fv(uViewPos, eye);
    // Bersihin layar
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
}