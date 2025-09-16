import * as THREE from "https://esm.sh/three@0.160.0";
import {OrbitControls} from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import {STLLoader} from "https://esm.sh/three@0.160.0/examples/jsm/loaders/STLLoader.js";
const scadWorker = new Worker(new URL("./openscad-worker.js", import.meta.url), {type: "module"});

const $ = (sel) => document.querySelector(sel);
const showLoading = (on = true) => {
  $("#loading").style.display = on ? "flex" : "none";
};
const log = (...args) => {
  const logEl = $("#log");
  logEl.textContent += (logEl.textContent ? "\n" : "") + args.join(" ");
  logEl.scrollTop = logEl.scrollHeight;
  console.debug(...args);
};

const slim = new SlimSelect({
  select: '#configSelect',
  events: {
    addable: (value) => {
      if (isNaN(value) || value.trim() === '') {
        return false;
      }

      return {text: value + 'mm', value: Number(value)}
    },
    afterChange: (values) => {
      $("#scadEditor").value = $("#scadEditor").value.replace(
        /(lens\s*=\s*)\[(.*?)\]/g,
        (match, prefix) => `${prefix}[${values.map(v => v.value).join(', ')}]`
      );
    }
  },
  data: [
    {text: '42mm', value: 42},
    {text: '43mm', value: 43},
    {text: '46mm', value: 46},
    {text: '49mm', value: 49},
    {text: '52mm', value: 52},
    {text: '55mm', value: 55},
    {text: '58mm', value: 58},
    {text: '60mm', value: 60},
    {text: '62mm', value: 62},
    {text: '67mm', value: 67},
    {text: '72mm', value: 72},
    {text: '77mm', value: 77},
    {text: '82mm', value: 82},
    {text: '86mm', value: 86},
    {text: '95mm', value: 95},
    {text: '105mm', value: 105},
  ]
});

const canvas = $("#canvas");
const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f14);
scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 0.7));

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

window.addEventListener("resize", () => {
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});
window.dispatchEvent(new Event("resize"));

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

let currentMesh = null;

function loadSTLIntoThree(stlBytes) {
  if (currentMesh) {
    scene.remove(currentMesh);
    currentMesh.geometry.dispose();

    if (currentMesh.material) {
      currentMesh.material.dispose();
    }

    currentMesh = null;
  }

  const loader = new STLLoader();

  const geom = loader.parse(stlBytes.buffer);
  geom.computeBoundingBox();

  const bb = geom.boundingBox;
  const size = new THREE.Vector3().subVectors(bb.max, bb.min);
  const center = new THREE.Vector3().addVectors(bb.min, bb.max).multiplyScalar(0.5);
  geom.translate(-center.x, -center.y, -center.z);

  const mat = new THREE.MeshStandardMaterial({metalness: .15, roughness: .6});
  currentMesh = new THREE.Mesh(geom, mat);
  scene.add(currentMesh);

  const radius = Math.max(size.x, size.y, size.z) * 0.6 + 1e-6;
  const dist = radius / Math.sin((camera.fov * Math.PI) / 360);
  camera.position.set(center.x + dist, center.y + dist * 0.6, center.z + dist);
  controls.target.set(0, 0, 0); controls.update();
}

let isRendering = false;

async function withRenderLock(fn) {
  if (isRendering) {
    return;
  }

  isRendering = true;

  try {
    await fn();
  } finally {
    isRendering = false;
  }
}

let workerMsgIdSeq = 1;
const pendingWorkerPromises = new Map();

scadWorker.onmessage = (event) => {
  const data = event.data || {};
  if (data.type === "log") {
    log(data.text || "");
    return;
  }

  const {id} = data;
  if (!id) return;
  const entry = pendingWorkerPromises.get(id);
  if (!entry) return;
  pendingWorkerPromises.delete(id);
  if (data.type === "result") {
    entry.resolve(new Uint8Array(data.buffer));
  } else if (data.type === "error") {
    entry.reject(new Error(data.message || "Worker error"));
  }
};

function renderOnceToSTL({sourceText, fnValue, outPath}) {
  const id = workerMsgIdSeq++;
  return new Promise((resolve, reject) => {
    pendingWorkerPromises.set(id, {resolve, reject});
    scadWorker.postMessage({id, action: "render", sourceText, fnValue, outPath});
  });
}

async function renderForView() {
  showLoading(true);
  $("#renderBtn").disabled = true;
  $("#downloadStlBtn").disabled = true;

  try {
    loadSTLIntoThree(await renderOnceToSTL({sourceText: $("#scadEditor").value, fnValue: 20, outPath: "/__view.stl"}));
    $("#downloadStlBtn").disabled = false;
  } catch (e) {
    log(e?.message || e);
  } finally {
    $("#renderBtn").disabled = false;
    showLoading(false);
  }
}

let lastHQUrl = null;

async function renderForDownload() {
  showLoading(true);
  $("#downloadStlBtn").disabled = true;

  try {
    const blob = new Blob(
      [await renderOnceToSTL({sourceText: $("#scadEditor").value, fnValue: 100, outPath: "/__download.stl"})],
      {type: "application/octet-stream"}
    );

    if (lastHQUrl) {
      URL.revokeObjectURL(lastHQUrl);
    }

    lastHQUrl = URL.createObjectURL(blob);

    triggerDownload(lastHQUrl, "TODO.stl");
  } catch (e) {
    log(e?.message || e);
  } finally {
    $("#downloadStlBtn").disabled = false;
    showLoading(false);
  }
}

function triggerDownload(href, filename) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  requestAnimationFrame(() => a.remove());
}

$("#renderBtn").addEventListener("click", () => withRenderLock(renderForView));
$("#downloadStlBtn").addEventListener("click", () => withRenderLock(renderForDownload));

async function loadInitialScad() {
  try {
    const res = await fetch("/scad/preset.scad");

    if (!res.ok) {
      throw new Error(`Failed to fetch scad: ${res.status} ${res.statusText}`);
    }

    $("#scadEditor").value = await res.text();
  } catch (e) {
    log(e.message || e);
  }
}

window.addEventListener("load", async () => {
  await loadInitialScad();
});

window.addEventListener("beforeunload", () => {
  if (lastHQUrl) {
    URL.revokeObjectURL(lastHQUrl);
  }

  renderer.dispose();
});
