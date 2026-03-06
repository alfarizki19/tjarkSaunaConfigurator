// ============================================================
//  loadModel.js — Tjark Sauna Configurator
//  Three.js scene setup + GLB model loader
//  Target container : #modelViewer (panel, not full window)
//  Model file       : model/saunaBuilding_ForProjects_v001.glb
//  Exposes          : window.saunaModel (for modelVisibilityController.js)
// ============================================================

import * as THREE from 'three';
import { GLTFLoader }   from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================================
//  VIEWER CONTAINER
// ============================================================
const viewer = document.getElementById('modelViewer');

// ============================================================
//  LOADING OVERLAY
//  Created via JS, injected into #modelViewer
// ============================================================
const loadingEl = document.createElement('div');
loadingEl.id = 'modelLoading';
loadingEl.textContent = 'Loading...';
Object.assign(loadingEl.style, {
    position:    'absolute',
    top:         '50%',
    left:        '50%',
    transform:   'translate(-50%, -50%)',
    color:       '#64748B',
    fontFamily:  'Inter, sans-serif',
    fontSize:    '0.875rem',
    fontWeight:  '500',
    zIndex:      '5',
    pointerEvents: 'none'
});
viewer.appendChild(loadingEl);

// Hide the placeholder <img> that was used in Phase 1
const viewerInner = viewer.querySelector('.viewer-inner');
if (viewerInner) viewerInner.style.display = 'none';

// ============================================================
//  1. SCENE
// ============================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xF1F5F9); // slate-100, matches main.css

// Expose scene globally so scaleController.js can create CSS2D indicators
window.saunaScene = scene;

// ============================================================
//  2. CAMERA
// ============================================================
const camera = new THREE.PerspectiveCamera(
    45,
    viewer.clientWidth / viewer.clientHeight,
    0.1,
    1000
);
camera.position.set(8, 5, 8);

// Expose camera globally so scaleController.js can render CSS2D labels
window.saunaCamera = camera;

// ============================================================
//  3. RENDERER
// ============================================================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(viewer.clientWidth, viewer.clientHeight);
renderer.toneMapping        = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace   = THREE.SRGBColorSpace;

// Canvas fills the viewer panel (positioned absolutely inside #modelViewer)
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top      = '0';
renderer.domElement.style.left     = '0';
renderer.domElement.style.width    = '100%';
renderer.domElement.style.height   = '100%';
viewer.appendChild(renderer.domElement);

// ============================================================
//  4. ORBIT CONTROLS
// ============================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping  = true;
controls.dampingFactor  = 0.05;
controls.minDistance    = 2;
controls.maxDistance    = 30;

// Chrome scroll fix: use lerp zoom instead of default wheel behaviour
renderer.domElement.addEventListener('wheel', (e) => {
    e.preventDefault();
    const sensitivity = 0.05;
    const delta = e.deltaY < 0 ? (1 - sensitivity) : (1 + sensitivity);
    camera.position.lerp(controls.target, 1 - delta);
    controls.update();
}, { passive: false });

renderer.domElement.addEventListener('mousedown', (e) => {
    if (e.button === 1) e.preventDefault();
}, { passive: false });

// ============================================================
//  5. LIGHTING
// ============================================================
scene.add(new THREE.AmbientLight(0xffffff, 1.5));

const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
sunLight.position.set(10, 10, 10);
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-5, 5, -5);
scene.add(fillLight);

// ============================================================
//  6. LOAD GLB MODEL
// ============================================================
const loader = new GLTFLoader();

loader.load(
    'model/saunaBuilding_ForProjects_v001.glb',

    // onLoad
    (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        // Auto-fit camera to model bounding box
        const box    = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size   = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        controls.target.copy(center);
        camera.position.set(
            center.x + maxDim * 1.2,
            center.y + maxDim * 0.8,
            center.z + maxDim * 1.2
        );
        controls.update();

        // Expose model to global scope for hideAndShowObject.js
        window.saunaModel = model;

        loadingEl.style.display = 'none';

        // Notify hideAndShowObject.js that model is ready
        window.dispatchEvent(new Event('modelLoaded'));
    },

    // onProgress
    (xhr) => {
        if (xhr.total > 0) {
            const percent = Math.round(xhr.loaded / xhr.total * 100);
            loadingEl.textContent = `Loading ${percent}%`;
        }
    },

    // onError
    (error) => {
        console.error('Failed to load model:', error);
        loadingEl.textContent = 'Failed to load model.';
    }
);

// ============================================================
//  7. ANIMATION LOOP
// ============================================================
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    // Render CSS2D dimension labels (set up by scaleController.js after model loads)
    if (window.saunaLabelRenderer) window.saunaLabelRenderer.render(scene, camera);
}
animate();

// ============================================================
//  8. RESIZE HANDLER
//  Uses ResizeObserver instead of window resize event.
//  This correctly tracks the actual #modelViewer panel size,
//  including the initial mobile layout (50vh) which CSS applies
//  after JS starts — window resize would miss that first paint.
// ============================================================
const resizeObserver = new ResizeObserver(() => {
    const w = viewer.clientWidth;
    const h = viewer.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    if (window.saunaLabelRenderer) window.saunaLabelRenderer.setSize(w, h);
});
resizeObserver.observe(viewer);
