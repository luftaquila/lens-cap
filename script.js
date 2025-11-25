import * as THREE from "https://esm.sh/three@0.160.0";
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/STLLoader.js";

const $ = (sel) => document.querySelector(sel);
const API_BASE = window.location.origin;

const showLoading = (on = true) => {
  $("#loading").style.display = on ? "flex" : "none";
};

const log = (...args) => {
  const logEl = $("#log");
  logEl.textContent += (logEl.textContent ? "\n" : "") + args.join(" ");
  logEl.scrollTop = logEl.scrollHeight;
  console.debug(...args);
};

// Get current parameters
function getParameters() {
  const lensValues = slim.selected();
  const strapWidth = parseFloat($("#strapWidthInput").value) || 11;
  return {
    lens: lensValues.map(v => typeof v === 'object' ? v.value : Number(v)),
    strapWidth: strapWidth
  };
}

const slim = new SlimSelect({
  select: '#configSelect',
  events: {
    addable: (value) => {
      if (isNaN(value) || value.trim() === '') {
        return false;
      }
      return { text: value + 'mm', value: Number(value) }
    },
    afterChange: () => {
      // Enable preview button when lens is selected
      const params = getParameters();
      $("#renderBtn").disabled = params.lens.length === 0;
    }
  },
  data: [
    { text: '42mm', value: 42 },
    { text: '43mm', value: 43 },
    { text: '46mm', value: 46 },
    { text: '49mm', value: 49 },
    { text: '52mm', value: 52 },
    { text: '55mm', value: 55 },
    { text: '58mm', value: 58 },
    { text: '60mm', value: 60 },
    { text: '62mm', value: 62 },
    { text: '67mm', value: 67 },
    { text: '72mm', value: 72 },
    { text: '77mm', value: 77 },
    { text: '82mm', value: 82 },
    { text: '86mm', value: 86 },
    { text: '95mm', value: 95 },
    { text: '105mm', value: 105 },
  ]
});

const canvas = $("#canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
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

  const mat = new THREE.MeshStandardMaterial({ metalness: .15, roughness: .6 });
  currentMesh = new THREE.Mesh(geom, mat);
  scene.add(currentMesh);

  const radius = Math.max(size.x, size.y, size.z) * 0.6 + 1e-6;
  const dist = radius / Math.sin((camera.fov * Math.PI) / 360);
  camera.position.set(center.x + dist, center.y + dist * 0.6, center.z + dist);
  controls.target.set(0, 0, 0);
  controls.update();
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

// Preview (free, low quality)
async function renderForView() {
  showLoading(true);
  $("#renderBtn").disabled = true;
  $("#downloadStlBtn").disabled = true;

  try {
    const params = getParameters();
    
    if (params.lens.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'No Lens Selected',
        text: 'Please select at least one lens size.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ff9800',
      });
      return;
    }

    log("Requesting preview...");
    const response = await fetch(`${API_BASE}/api/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Server error: ${response.status}`);
    }

    const stlBuffer = await response.arrayBuffer();
    loadSTLIntoThree(new Uint8Array(stlBuffer));
    $("#downloadStlBtn").disabled = false;
    log("Preview loaded successfully");
  } catch (e) {
    log("Error: " + (e?.message || e));
    await Swal.fire({
      icon: 'error',
      title: 'Preview Failed',
      text: e?.message || 'Failed to generate preview. Please try again.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#f44336',
    });
  } finally {
    $("#renderBtn").disabled = false;
    showLoading(false);
  }
}

// Download STL (paid, high quality)
async function renderForDownload() {
  showLoading(true);
  $("#downloadStlBtn").disabled = true;

  try {
    const params = getParameters();
    const email = $("#emailInput").value.trim();

    if (params.lens.length === 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'No Lens Selected',
        text: 'Please select at least one lens size.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ff9800',
      });
      return;
    }

    if (!email || !email.includes('@')) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid Email',
        text: 'Please enter a valid email address.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ff9800',
      });
      return;
    }

    log("Creating checkout session...");
    const response = await fetch(`${API_BASE}/api/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        email: email,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Server error: ${response.status}`);
    }

    const { url } = await response.json();
    
    // Redirect to Stripe checkout
    window.location.href = url;
  } catch (e) {
    log("Error: " + (e?.message || e));
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: e?.message || 'Failed to create checkout session. Please try again.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#f44336',
    });
    $("#downloadStlBtn").disabled = false;
    showLoading(false);
  }
}

// Handle payment result from URL parameters
async function handlePaymentResult() {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  const sessionId = urlParams.get('session_id');
  
  // Clean up URL parameters
  if (paymentStatus) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  if (paymentStatus === 'success' && sessionId) {
    showLoading(true);
    try {
      log("Payment successful! Downloading STL...");
      const response = await fetch(`${API_BASE}/api/download-stl/${sessionId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Server error: ${response.status}`);
      }

      const stlBuffer = await response.arrayBuffer();
      const blob = new Blob([stlBuffer], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      
      const params = getParameters();
      const sortedLens = [...params.lens].sort((a, b) => a - b);
      const filename = `${sortedLens.join('-')}mm.stl`;
      
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      requestAnimationFrame(() => {
        a.remove();
        URL.revokeObjectURL(url);
      });
      
      // Show success alert
      await Swal.fire({
        icon: 'success',
        title: 'Payment Successful!',
        html: `
          <p>Your STL file has been downloaded.</p>
          <p>Check your email for the file as well.</p>
        `,
        confirmButtonText: 'OK',
        confirmButtonColor: '#4caf50',
      });
      
      log("STL file downloaded! Check your email for the file as well.");
    } catch (e) {
      log("Error downloading STL: " + (e?.message || e));
      await Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: e?.message || 'Failed to download STL file. Please contact support.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#f44336',
      });
    } finally {
      showLoading(false);
    }
  } else if (paymentStatus === 'cancelled') {
    await Swal.fire({
      icon: 'info',
      title: 'Payment Cancelled',
      text: 'Your payment was cancelled. No charges were made. You can still use the free preview feature.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#6fb2ff',
    });
  }
}

$("#renderBtn").addEventListener("click", () => withRenderLock(renderForView));
$("#downloadStlBtn").addEventListener("click", () => withRenderLock(renderForDownload));

// Initialize button states
$("#renderBtn").disabled = true;

// Handle payment result on page load
window.addEventListener("load", () => {
  handlePaymentResult();
});

window.addEventListener("beforeunload", () => {
  renderer.dispose();
});
