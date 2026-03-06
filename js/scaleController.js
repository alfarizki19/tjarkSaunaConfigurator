// ============================================================
//  scaleController.js — Tjark Sauna Configurator
//  Sistem Scale Cabin (Dinding + Atap)
//
//  Referensi utama: Old Version saunaConfiguratorv01003004 / modelController.js
//
//  Pedoman skala:
//    Scale 1.0 di Blender  = 2 meter di dunia nyata
//    Scale 0.5 di Blender  = 1 meter di dunia nyata
//    → sX = widthCm  / 200   (contoh: 200cm → sX=1.0, 350cm → sX=1.75)
//    → sZ = lengthCm / 200   (contoh: 200cm → sZ=1.0, 350cm → sZ=1.75)
//
//  Dependencies (window globals dari loadModel.js):
//    window.saunaModel        → model Object3D
//    window.saunaScene        → Three.js Scene
//    window.saunaCamera       → Three.js Camera
//    window.saunaLabelRenderer→ diset di sini, dirender oleh loadModel.js animate loop
//
//  Grup dinding di GLB (arah Three.js setelah GLTF export Blender):
//    backWallGroup   → z NEGATIF  (belakang bangunan)
//    frontWall_Group → z POSITIF  (depan bangunan, tampak kamera)
//    leftWall_Group  → x NEGATIF  (kiri bangunan)
//    rightWall_Group → x POSITIF  (kanan bangunan)
//    roofGroup       → y=2.029, z=0 (atap, di atas)
// ============================================================

import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

const viewer = document.getElementById('modelViewer');

// ============================================================
//  ★ BAGIAN 1 — KONSTANTA (SESUAIKAN DI SINI)
//  Semua nilai di bagian ini bisa diubah tanpa menyentuh kode lain.
// ============================================================

// ------------------------------------------------------------
//  OFFSET POSISI INDIKATOR DIMENSI
//
//  Rumus posisi:
//    indikator LEBAR  : (frontWall_Group.z × sZ) + OFFSET_IND_WIDTH
//    indikator PANJANG: (rightWall_Group.x × sX) + OFFSET_IND_LENGTH
//
//  frontWall_Group ada di z POSITIF → nilai positif = geser keluar (makin jauh ke depan)
//  rightWall_Group ada di x POSITIF → nilai positif = geser keluar (makin jauh ke kanan)
//  Nilai negatif = masuk ke dalam bangunan
// ------------------------------------------------------------
const OFFSET_IND_WIDTH  = 0.5;   // ← ubah untuk indikator LEBAR  (jauh ke depan = positif)
const OFFSET_IND_LENGTH = 0.6;   // ← ubah untuk indikator PANJANG (jauh ke kanan = positif)

// ------------------------------------------------------------
//  TABEL TOLERANSI SCALE
//
//  Mengikuti pola versi lama (v01003004):
//    fWallX = sX + tolWallX  → scale dinding BELAKANG (X) + panel DEPAN (X)
//    fWallZ = sZ + tolWallZ  → scale dinding KIRI & KANAN (Z)
//    fRoofX = sX + tolRoofX  → scale roofWood_Back & Front (X)
//    fRoofZ = sZ + tolRoofZ  → scale roofWood_Left & Right (Z)
//
//  Setiap tabel punya checkpoint: 200, 230, 270, 310, 350 cm.
//  Nilai berlaku mulai dari checkpoint tersebut ke atas.
//  Nilai positif = perbesar sedikit (tutup gap).
//  Nilai negatif = perkecil sedikit (hindari overlap).
//
//  Cara tuning:
//    1. Geser slider ke nilai yang ingin diuji (misal 270 cm)
//    2. Amati gap yang muncul
//    3. Sesuaikan nilai tol pada checkpoint tersebut
//    4. Contoh referensi versi lama (≥250cm width): tol_Wall_X=+0.02, tol_Roof_X=−0.02
//       (≥230cm depth): tol_Wall_Y=−0.015, tol_Roof_Y=+0.05
// ------------------------------------------------------------

// Width (X) — mempengaruhi dinding belakang + panel depan
const WIDTH_TOL_WALL = {
    200: 0.003,     // baseline 2.0m — tidak ada celah, tidak perlu toleransi
    230: 0.008,     // ← 2.3m: naikkan jika ada celah di sambungan dinding belakang & samping
    270: 0.014,     // ← 2.7m
    310: 0.018,     // ← 3.1m
    350: 0.028,     // ← 3.5m (maksimum slider)
};

// Width (X) — mempengaruhi balok atap depan (roofWood_Back & Front)
const WIDTH_TOL_ROOF = {
    200: 0,     // baseline
    230: -0.008,     // ← 2.3m: sesuaikan jika roofWood_Back/Front ada gap atau menonjol
    270: -0.012,     // ← 2.7m
    310: -0.023,     // ← 3.1m
    350: -0.028,     // ← 3.5m
};

// Length (Z) — mempengaruhi dinding kiri & kanan
const LENGTH_TOL_WALL = {
    200: 0,     // baseline
    230: -0.005,     // ← 2.3m: naikkan jika ada celah di sambungan dinding samping & belakang/depan
    270: -0.008,     // ← 2.7m
    310: -0.017,     // ← 3.1m
    350: -0.02,     // ← 3.5m
};

// Length (Z) — mempengaruhi balok atap samping (roofWood_Left & Right)
const LENGTH_TOL_ROOF = {
    200: 0,     // baseline
    230: 0.008,     // ← 2.3m: sesuaikan jika roofWood_Left/Right ada gap atau menonjol
    270: 0.012,     // ← 2.7m
    310: 0.023,     // ← 3.1m
    350: 0.028,     // ← 3.5m
};

// Length (Z) — mempengaruhi bench B (scale.z = panjang bench, sepanjang dinding kiri)
// Checkpoint setiap 20cm untuk transisi lebih halus.
// Nilai diturunkan dari uji coba: 200=0, 230=0.1, 270=0.18, 310=0.28, 350=0.34
const LENGTH_TOL_BENCH_B = {
    200: 0,      // baseline
    220: 0.067,  // ← 2.2m
    240: 0.12,   // ← 2.4m
    260: 0.16,   // ← 2.6m
    280: 0.205,  // ← 2.8m
    300: 0.255,  // ← 3.0m
    320: 0.295,  // ← 3.2m
    340: 0.325,  // ← 3.4m
    350: 0.34,   // ← 3.5m (maksimum slider)
};

// ============================================================
//  BAGIAN 2 — DATA STRUCTURES
// ============================================================
const G        = {};   // { key: Object3D }  — grup referensi
const I        = {};   // { key: {x,y,z} }   — posisi LOCAL awal saat load
const roofSubs = [];   // { mesh, initX, initZ, type, name } — sub-mesh atap

// Sub-mesh benchB yang perlu koreksi individual (tanpa toleransi scale)
// Diisi saat initScaleController, sebelum updateBuilding() pertama.
// type: 'backrest' | 'woodDown_end' | 'woodTop'
const benchBSubs = [];

// roofWood materials untuk UV tiling (diklon saat init)
const roofWoodMats = [];  // { mesh, isFB, isLR }

let indX = null;  // indikator LEBAR  (sepanjang sumbu X)
let indZ = null;  // indikator PANJANG (sepanjang sumbu Z, group dirotasi 90°)

// Offset tetap bench A dari back wall (arah Z)
// Dihitung sekali saat init: I.benchA_Group.z − I.backWallGroup.z
// backWall Z = −0.9686, benchA Z = −0.5394  →  offset ≈ +0.4292 (bench di depan back wall)
let benchAOffsetZ = 0;

// Offset tetap bench B dari front wall (arah Z) dan dari left wall (arah X)
// Dihitung sekali saat init:
//   benchBOffsetZ = I.benchB_group.z − I.frontWall_Group.z  →  ≈ −0.040 (bench di belakang frontWall)
//   benchBOffsetX = I.benchB_group.x − I.leftWall_Group.x   →  ≈ +0.313 (bench di kanan leftWall)
let benchBOffsetZ = 0;
let benchBOffsetX = 0;

// ============================================================
//  BAGIAN 3 — HELPER FUNCTIONS
// ============================================================

// Ambil nilai toleransi untuk ukuran (cm) dari tabel.
// Mengambil nilai dari checkpoint tertinggi yang <= sizeCm.
function getTolerance(sizeCm, table) {
    let tol = 0;
    const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
    for (const k of keys) {
        if (sizeCm >= k) tol = table[k];
    }
    return tol;
}

// Temukan group dengan dua cara (robust terhadap perbedaan nama di GLB):
//  1. Langsung pakai nama group (primaryName) → model.getObjectByName()
//  2. Jika tidak ketemu, cari parent dari mesh anak (fallbackChildName)
function findGroup(model, primaryName, fallbackChildName) {
    let obj = model.getObjectByName(primaryName);
    if (!obj && fallbackChildName) {
        const child = model.getObjectByName(fallbackChildName);
        if (child && child.parent) obj = child.parent;
    }
    if (obj) {
        G[primaryName] = obj;
        I[primaryName] = { x: obj.position.x, y: obj.position.y, z: obj.position.z };
    } else {
        console.warn('[scaleController] Grup tidak ditemukan:', primaryName, '| fallback:', fallbackChildName);
    }
    return obj;
}

// ============================================================
//  BAGIAN 4 — CSS2D RENDERER & INDIKATOR DIMENSI
// ============================================================

function setupLabelRenderer() {
    const lr = new CSS2DRenderer();
    lr.setSize(viewer.clientWidth, viewer.clientHeight);
    Object.assign(lr.domElement.style, {
        position:      'absolute',
        top:           '0',
        left:          '0',
        pointerEvents: 'none',
        zIndex:        '4',
    });
    viewer.appendChild(lr.domElement);
    window.saunaLabelRenderer = lr;  // loadModel.js animate loop merender ini
}

function makeDimensionLine(scene) {
    const group    = new THREE.Group();
    const mat      = new THREE.LineBasicMaterial({ color: 0x64748B });

    // Garis utama: bentang dari -1 ke +1 di sumbu X lokal
    const mainLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3( 1, 0, 0),
        ]), mat
    );

    // Tick mark tegak lurus di ujung kiri dan kanan
    const tickGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, -0.12),
        new THREE.Vector3(0, 0,  0.12),
    ]);
    const tickA = new THREE.Line(tickGeo, mat);
    const tickB = new THREE.Line(tickGeo, mat);

    // Label teks CSS2D
    const div = document.createElement('div');
    div.style.cssText = [
        'background:rgba(255,255,255,0.92)',
        'padding:2px 7px',
        'border-radius:4px',
        'font-size:11px',
        'color:#334155',
        'font-family:Inter,sans-serif',
        'font-weight:600',
        'pointer-events:none',
        'white-space:nowrap',
        'box-shadow:0 1px 4px rgba(0,0,0,0.18)',
    ].join(';');
    const label = new CSS2DObject(div);

    group.add(mainLine, tickA, tickB, label);
    scene.add(group);
    return { group, mainLine, tickA, tickB, div };
}

// ============================================================
//  BAGIAN 5 — INIT SCALE CONTROLLER
//  Dipanggil sekali setelah model GLB selesai di-load.
// ============================================================
function initScaleController(model) {
    const scene = window.saunaScene;
    if (!scene) {
        console.warn('[scaleController] window.saunaScene belum tersedia');
        return;
    }

    // ----------------------------------------------------------
    //  5A. Temukan semua grup + catat posisi LOCAL awal
    //  Posisi LOCAL = posisi relatif terhadap parent (buildingGroup)
    // ----------------------------------------------------------
    findGroup(model, 'backWallGroup',   'wall_Back_exterior_A');
    findGroup(model, 'frontWall_Group', 'wall_FrontLeft_exterior_A');
    findGroup(model, 'leftWall_Group',  'wall_Left_exterior_A');
    findGroup(model, 'rightWall_Group', 'wall_Right_exterior_A');
    findGroup(model, 'roofGroup',       'roof_exterior_A');
    findGroup(model, 'ofenGroup',       'ofenA');
    findGroup(model, 'benchA_Group',    'benchA_main_A');
    findGroup(model, 'benchB_group',    'benchB_main_A');

    // Hitung offset tetap bench A dari back wall (sekali saja)
    // backWall Z = −0.9686, benchA Z = −0.5394  →  offset ≈ +0.4292
    if (I.benchA_Group && I.backWallGroup) {
        benchAOffsetZ = I.benchA_Group.z - I.backWallGroup.z;
    }

    // Hitung offset tetap bench B dari front wall (Z) dan left wall (X)
    // frontWall Z = +0.9700, benchB Z = +0.9304  →  benchBOffsetZ ≈ −0.040
    // leftWall  X = −0.9690, benchB X = −0.6561  →  benchBOffsetX ≈ +0.313
    if (I.benchB_group && I.frontWall_Group) {
        benchBOffsetZ = I.benchB_group.z - I.frontWall_Group.z;
    }
    if (I.benchB_group && I.leftWall_Group) {
        benchBOffsetX = I.benchB_group.x - I.leftWall_Group.x;
    }

    // ----------------------------------------------------------
    //  5A-2. Catat sub-mesh benchB yang perlu koreksi individual
    //
    //  benchB_group.scale.z = fBenchBZ (mengandung toleransi).
    //  Beberapa child perlu posisi/scale tanpa toleransi:
    //
    //  'backrest'     → benchB_backrest_A/B/C
    //    Scale efektif harus sZ (bukan fBenchBZ).
    //    Koreksi: child.scale.z = sZ / fBenchBZ
    //    Koreksi: child.position.z = initLocalZ × (sZ / fBenchBZ)
    //
    //  'woodDown_end' → benchB_woodDown_left_* & benchB_woodDown_right_*
    //    Posisi dikalkulasi ulang tanpa toleransi.
    //    Koreksi: child.position.z = initLocalZ × (sZ / fBenchBZ)
    //
    //  'woodTop'      → benchB_woodTop_left/right/center_*
    //    Posisi dikalkulasi ulang tanpa toleransi.
    //    Koreksi: child.position.z = initLocalZ × (sZ / fBenchBZ)
    //
    //  Rumus: world_z = group.pos.z + child.pos.z × group.scale.z
    //         Inginkan world_z = group.pos.z + initLocalZ × sZ
    //         → child.pos.z = initLocalZ × sZ / fBenchBZ
    //
    //  initLocalZ diambil dari posisi LOCAL child saat model baru di-load
    //  (sebelum updateBuilding pertama, scale masih 1.0).
    // ----------------------------------------------------------
    if (G.benchB_group) {
        G.benchB_group.traverse(child => {
            if (!child.isMesh) return;
            const n = child.name;
            let type = null;
            if      (n.includes('benchB_backrest'))                                             type = 'backrest';
            else if (n.includes('benchB_woodDown_left') || n.includes('benchB_woodDown_right')) type = 'woodDown_end';
            else if (n.includes('benchB_woodTop'))                                              type = 'woodTop';
            if (type) {
                benchBSubs.push({ mesh: child, initLocalZ: child.position.z, type });
            }
        });
    }

    // ----------------------------------------------------------
    //  5B. Catat semua sub-mesh atap + posisi LOCAL awal
    //  Sub-mesh ini ANAK LANGSUNG dari roofGroup.
    //  Karena roofGroup ada di z=0, posisi LOCAL ≈ posisi WORLD.
    //
    //  type 'panel'  : roof_exterior_* dan roof_interior_*
    //  type 'edgeFB' : roofWood_Back_* dan roofWood_Front_*  (skala X = lebar)
    //  type 'edgeLR' : roofWood_Left_* dan roofWood_Right_*  (skala Z = panjang)
    // ----------------------------------------------------------
    if (G.roofGroup) {
        G.roofGroup.traverse(child => {
            if (!child.isMesh) return;
            const n = child.name;
            let type = null;
            if      (n.includes('roof_exterior') || n.includes('roof_interior'))  type = 'panel';
            else if (n.includes('roofWood_Back') || n.includes('roofWood_Front')) type = 'edgeFB';
            else if (n.includes('roofWood_Left') || n.includes('roofWood_Right')) type = 'edgeLR';
            if (type) {
                roofSubs.push({
                    mesh:  child,
                    initX: child.position.x,
                    initZ: child.position.z,
                    type,
                    name:  n,
                });
            }
        });
    }

    // ----------------------------------------------------------
    //  5C. Klon material roofWood untuk UV tiling
    //  Saat mesh diskala, tekstur ikut melar.
    //  UV repeat disesuaikan agar tekstur tetap proporsional.
    //  Material diklon agar tidak mempengaruhi mesh lain yang
    //  berbagi material yang sama.
    // ----------------------------------------------------------
    const UV_MAPS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap'];
    if (G.roofGroup) {
        G.roofGroup.traverse(child => {
            if (!child.isMesh || !child.name.includes('roofWood')) return;
            if (!child.material) return;
            child.material = child.material.clone();
            UV_MAPS.forEach(key => {
                if (child.material[key]) {
                    child.material[key] = child.material[key].clone();
                    child.material[key].wrapS = THREE.RepeatWrapping;
                    child.material[key].wrapT = THREE.RepeatWrapping;
                }
            });
            const isFB = child.name.includes('roofWood_Back') || child.name.includes('roofWood_Front');
            const isLR = child.name.includes('roofWood_Left') || child.name.includes('roofWood_Right');
            roofWoodMats.push({ mesh: child, isFB, isLR });
        });
    }

    // ----------------------------------------------------------
    //  5D. Setup CSS2D renderer + buat dua indikator dimensi
    // ----------------------------------------------------------
    setupLabelRenderer();
    indX = makeDimensionLine(scene);
    indZ = makeDimensionLine(scene);
    indZ.group.rotation.y = Math.PI / 2;  // rotasi 90° → garis mengikuti sumbu Z scene

    // ----------------------------------------------------------
    //  5E. Hubungkan slider ke updateBuilding
    // ----------------------------------------------------------
    const lengthInput = document.getElementById('lengthInput');
    const widthInput  = document.getElementById('widthInput');
    if (lengthInput) lengthInput.addEventListener('input', updateBuilding);
    if (widthInput)  widthInput.addEventListener('input', updateBuilding);

    updateBuilding();
}

// ============================================================
//  BAGIAN 6 — UPDATE BUILDING
//  Dipanggil setiap kali slider digeser dan sekali saat init.
//  Mengikuti logika versi lama (v01003004 / modelController.js).
// ============================================================
function updateBuilding() {
    const lengthInput = document.getElementById('lengthInput');
    const widthInput  = document.getElementById('widthInput');
    if (!lengthInput || !widthInput) return;

    const widthCm  = parseFloat(widthInput.value);
    const lengthCm = parseFloat(lengthInput.value);

    // Baseline: 200cm = scale 1.0 (= 2 meter di dunia nyata)
    // Ref: scale 1.0 Blender = 2m, scale 0.5 Blender = 1m
    const sX = widthCm  / 200;
    const sZ = lengthCm / 200;

    // ----------------------------------------------------------
    //  Scale efektif = scale dasar + toleransi
    //  (mengikuti pola: fWallX, fWallY, fRoofX, fRoofY di versi lama)
    //
    //  POSISI selalu pakai sX/sZ mentah (=ukuran sesungguhnya)
    //  SCALE  selalu pakai fWall*/fRoof* (=ukuran + koreksi gap)
    // ----------------------------------------------------------
    const fWallX = sX + getTolerance(widthCm,  WIDTH_TOL_WALL);   // ← scale X dinding belakang & panel depan
    const fWallZ = sZ + getTolerance(lengthCm, LENGTH_TOL_WALL);  // ← scale Z dinding kiri & kanan
    const fRoofX = sX + getTolerance(widthCm,  WIDTH_TOL_ROOF);   // ← scale X roofWood Back/Front
    const fRoofZ = sZ + getTolerance(lengthCm, LENGTH_TOL_ROOF);  // ← scale Z roofWood Left/Right

    // ----------------------------------------------------------
    //  DINDING BELAKANG (backWallGroup)
    //  scale.x = fWallX  → melebar mengikuti WIDTH slider
    //  position.z = init.z × sZ → bergeser ke belakang mengikuti LENGTH slider
    //  (init.z bernilai NEGATIF, sZ membesar → makin ke -Z = makin ke belakang)
    // ----------------------------------------------------------
    if (G.backWallGroup) {
        G.backWallGroup.scale.x    = fWallX;
        G.backWallGroup.position.z = I.backWallGroup.z * sZ;
    }

    // ----------------------------------------------------------
    //  DINDING KIRI (leftWall_Group)
    //  scale.z = fWallZ  → memanjang mengikuti LENGTH slider
    //  position.x = init.x × sX → bergeser ke kiri mengikuti WIDTH slider
    //  (init.x bernilai NEGATIF, sX membesar → makin ke -X = makin ke kiri)
    // ----------------------------------------------------------
    if (G.leftWall_Group) {
        G.leftWall_Group.scale.z    = fWallZ;
        G.leftWall_Group.position.x = I.leftWall_Group.x * sX;
    }

    // ----------------------------------------------------------
    //  DINDING KANAN (rightWall_Group)
    //  scale.z = fWallZ  → memanjang mengikuti LENGTH slider
    //  position.x = init.x × sX → bergeser ke kanan mengikuti WIDTH slider
    //  (init.x bernilai POSITIF, sX membesar → makin ke +X = makin ke kanan)
    // ----------------------------------------------------------
    if (G.rightWall_Group) {
        G.rightWall_Group.scale.z    = fWallZ;
        G.rightWall_Group.position.x = I.rightWall_Group.x * sX;
    }

    // ----------------------------------------------------------
    //  DINDING DEPAN (frontWall_Group) + KOMPENSASI PANEL DEPAN
    //  position.z = init.z × sZ → bergeser ke depan mengikuti LENGTH slider
    //  (init.z bernilai POSITIF, sZ membesar → makin ke +Z = makin ke depan)
    //
    //  Panel wall_FrontLeft/Right dan glass_FrontLeft/Right perlu dikompensasi
    //  agar tidak ada gap ke dinding samping saat bangunan melebar.
    //  Formula kompensasi (dari versi lama, derivasi geometri pivot panel):
    //    scaleKomp = (pillarX × fWallX − pivotX) / (pillarX − pivotX)
    //  di mana:
    //    pillarX = posisi X awal rightWall_Group  (~0.9646)
    //    pivotX  = posisi X awal wall_FrontRight  ( 0.3232, dari data mesh)
    //
    //  doorGroup adalah ANAK dari frontWall_Group → ikut bergerak otomatis,
    //  tidak perlu update posisi door secara eksplisit.
    // ----------------------------------------------------------
    if (G.frontWall_Group) {
        G.frontWall_Group.position.z = I.frontWall_Group.z * sZ;

        const PILLAR_X  = I.rightWall_Group ? I.rightWall_Group.x : 0.964641;
        const PIVOT_X   = 0.323186;   // posisi X wall_FrontRight dari data mesh
        const scaleKomp = (PILLAR_X * fWallX - PIVOT_X) / (PILLAR_X - PIVOT_X);

        G.frontWall_Group.traverse(child => {
            const n = child.name;
            if (
                n.includes('wall_FrontLeft')  || n.includes('wall_FrontRight') ||
                n.includes('glass_FrontLeft') || n.includes('glass_FrontRight')
            ) {
                child.scale.x = scaleKomp;
            }
        });
    }

    // ----------------------------------------------------------
    //  OVEN (ofenGroup)
    //  Tidak di-scale — hanya berpindah posisi.
    //
    //  Posisi awal (Three.js):
    //    x ≈ +0.668 → sisi kanan (antara center dan rightWall)
    //    z ≈ +0.618 → area depan (antara center dan frontWall)
    //
    //  Saat WIDTH naik  → oven ikut geser ke kanan (sX besar → x makin +)
    //  Saat LENGTH naik → oven ikut geser ke depan (sZ besar → z makin +)
    // ----------------------------------------------------------
    if (G.ofenGroup) {
        G.ofenGroup.position.x = I.ofenGroup.x * sX;
        G.ofenGroup.position.z = I.ofenGroup.z * sZ;
    }

    // ----------------------------------------------------------
    //  BENCH A (benchA_Group)
    //  Bench panjang di sisi belakang bangunan (sepanjang width/X).
    //
    //  Posisi awal (Three.js):
    //    x ≈ 0     → center (tidak bergeser ke kiri/kanan)
    //    z ≈ -0.54 → area belakang (ikut backWallGroup, nilai negatif)
    //
    //  scale.x = sX  → bench melebar mengikuti WIDTH (tanpa toleransi — sudah sesuai)
    //  position.z = (backWall.z × sZ) + benchAOffsetZ
    //    → bench selalu berjarak konstan dari back wall saat LENGTH berubah
    //    backWall.z × sZ = posisi back wall saat ini (negatif, makin ke belakang)
    //    + benchAOffsetZ (+0.4292) = bench berada 0.43 unit di depan back wall
    // ----------------------------------------------------------
    if (G.benchA_Group) {
        G.benchA_Group.scale.x    = sX;
        G.benchA_Group.position.z = (I.backWallGroup.z * sZ) + benchAOffsetZ;
    }

    // ----------------------------------------------------------
    //  BENCH B (benchB_group)
    //  Bench samping di sisi kiri bangunan (memanjang sepanjang length/Z).
    //
    //  Posisi awal (Three.js):
    //    x ≈ −0.656 → sisi kiri (dekat leftWall −0.969)
    //    z ≈ +0.930 → area depan (dekat frontWall +0.970)
    //
    //  scale.z = fBenchBZ → bench memanjang mengikuti LENGTH
    //    toleransi diambil dari LENGTH_TOL_BENCH_B (checkpoint setiap 20cm)
    //  position.z = (frontWall.z × sZ) + benchBOffsetZ
    //    → bench selalu berjarak konstan dari front wall saat LENGTH berubah
    //    benchBOffsetZ ≈ −0.040 (bench sedikit di belakang frontWall, ke dalam)
    //  position.x = (leftWall.x × sX) + benchBOffsetX
    //    → bench selalu berjarak konstan dari left wall saat WIDTH berubah
    //    benchBOffsetX ≈ +0.313 (bench sedikit ke kanan dari leftWall, ke dalam)
    // ----------------------------------------------------------
    const fBenchBZ = sZ + getTolerance(lengthCm, LENGTH_TOL_BENCH_B);

    if (G.benchB_group) {
        G.benchB_group.scale.z    = fBenchBZ;
        G.benchB_group.position.z = (I.frontWall_Group.z * sZ) + benchBOffsetZ;
        G.benchB_group.position.x = (I.leftWall_Group.x  * sX) + benchBOffsetX;
    }

    // ----------------------------------------------------------
    //  BENCH B — KOREKSI INDIVIDUAL SUB-MESH (tanpa toleransi)
    //
    //  benchB_group.scale.z = fBenchBZ (mengandung toleransi).
    //  Sub-mesh tertentu harus "melepas" pengaruh toleransi tsb.
    //
    //  Rumus: world_z = group.pos.z + child.pos.z × group.scale.z
    //  Inginkan: world_z = group.pos.z + initLocalZ × sZ
    //  → child.pos.z = initLocalZ × (sZ / fBenchBZ)  [= scaleRatio]
    //
    //  Backrest   → koreksi POSISI + SCALE (agar mesh tidak melar akibat toleransi)
    //               child.scale.z = scaleRatio
    //               efektif world scale Z = fBenchBZ × scaleRatio = sZ ✓
    //
    //  woodDown Right/Left → koreksi POSISI saja
    //  woodTop (semua)     → koreksi POSISI saja
    //
    //  Jika fBenchBZ = sZ (toleransi 0), scaleRatio = 1 → tidak ada perubahan.
    // ----------------------------------------------------------
    if (fBenchBZ > 0) {
        const scaleRatio = sZ / fBenchBZ;
        benchBSubs.forEach(({ mesh, initLocalZ, type }) => {
            mesh.position.z = initLocalZ * scaleRatio;
            if (type === 'backrest') {
                mesh.scale.z = scaleRatio;
            }
        });
    }

    // ----------------------------------------------------------
    //  ATAP — SUB-MESH (roofGroup children)
    //  Mengikuti logika versi lama persis:
    //
    //  'panel' (roof_exterior_*, roof_interior_*):
    //    scale.set(sX, sZ, sZ)  → RAW scale, tanpa toleransi
    //    (sZ dipakai untuk Y dan Z mengikuti orientasi geometri atap di GLB)
    //
    //  'edgeFB' (roofWood_Back_*, roofWood_Front_*):
    //    scale.x = fRoofX  → skala lebar (X)
    //    position.z = posisi grup dinding acuan × sZ (RAW)
    //      Back → ikut backWallGroup.z  (negatif, makin ke belakang)
    //      Front → ikut frontWall_Group.z (positif, makin ke depan)
    //
    //  'edgeLR' (roofWood_Left_*, roofWood_Right_*):
    //    scale.z = fRoofZ  → skala panjang (Z)
    //    position.x = posisi grup dinding acuan × sX (RAW)
    //      Left  → ikut leftWall_Group.x  (negatif, makin ke kiri)
    //      Right → ikut rightWall_Group.x (positif, makin ke kanan)
    // ----------------------------------------------------------
    roofSubs.forEach(({ mesh, initZ, type, name }) => {
        if (type === 'panel') {
            mesh.scale.set(sX, sZ, sZ);

        } else if (type === 'edgeFB') {
            mesh.scale.x    = fRoofX;
            mesh.position.z = name.includes('Back')
                ? (I.backWallGroup   ? I.backWallGroup.z   * sZ : initZ * sZ)
                : (I.frontWall_Group ? I.frontWall_Group.z * sZ : initZ * sZ);

        } else if (type === 'edgeLR') {
            mesh.scale.z    = fRoofZ;
            mesh.position.x = name.includes('Left')
                ? (I.leftWall_Group  ? I.leftWall_Group.x  * sX : mesh.position.x)
                : (I.rightWall_Group ? I.rightWall_Group.x * sX : mesh.position.x);
        }
    });

    // ----------------------------------------------------------
    //  ATAP — UV TILING roofWood
    //  Mencegah tekstur tampak melar saat mesh diskala.
    //  repeat.x disesuaikan dengan scale factor efektif masing-masing sumbu.
    //    roofWood_Back/Front (scale X) → repeat.x = fRoofX
    //    roofWood_Left/Right (scale Z) → repeat.x = fRoofZ
    // ----------------------------------------------------------
    roofWoodMats.forEach(({ mesh, isFB, isLR }) => {
        if (!mesh.material) return;
        const repeatVal = isFB ? fRoofX : (isLR ? fRoofZ : 1);
        ['map', 'normalMap', 'roughnessMap', 'metalnessMap'].forEach(key => {
            if (mesh.material[key]) {
                mesh.material[key].repeat.x = repeatVal;
                mesh.material[key].needsUpdate = true;
            }
        });
    });

    // ----------------------------------------------------------
    //  INDIKATOR DIMENSI
    //
    //  Rumus posisi (lihat konstanta OFFSET_IND_* di Bagian 1):
    //    indX (LEBAR)  : z = (frontWall_Group.z × sZ) + OFFSET_IND_WIDTH
    //    indZ (PANJANG): x = (rightWall_Group.x × sX) + OFFSET_IND_LENGTH
    //
    //  Span garis menggunakan scale RAW (sX/sZ) agar sesuai
    //  dengan ukuran nominal bangunan yang tertera di label.
    // ----------------------------------------------------------
    if (indX && indZ && I.frontWall_Group && I.rightWall_Group) {
        const frontZ = I.frontWall_Group.z * sZ;   // posisi Z frontWall saat ini (+z positif)
        const rightX = I.rightWall_Group.x * sX;   // posisi X rightWall saat ini (+x positif)

        // Indikator LEBAR — garis horizontal, di depan frontWall
        indX.group.position.set(0, 0.15, frontZ + OFFSET_IND_WIDTH);
        indX.mainLine.scale.x = sX;
        indX.tickA.position.x = -sX;
        indX.tickB.position.x =  sX;
        indX.div.textContent  = `${widthCm} cm`;

        // Indikator PANJANG — garis sepanjang sumbu Z (group dirotasi 90°), di kanan rightWall
        indZ.group.position.set(rightX + OFFSET_IND_LENGTH, 0.15, 0);
        indZ.mainLine.scale.x = sZ;
        indZ.tickA.position.x = -sZ;
        indZ.tickB.position.x =  sZ;
        indZ.div.textContent  = `${lengthCm} cm`;
    }

    // ----------------------------------------------------------
    //  SUMMARY DIMENSION ROW
    //  Perbarui baris Dimension di summary modal.
    //  (jangan diubah — sudah PERFECT per instruksi user)
    // ----------------------------------------------------------
    const dimNameEl = document.querySelector('#summaryItems_Dimension .summary-item-name');
    if (dimNameEl) {
        dimNameEl.innerHTML = `<strong>Dimension:</strong> ${lengthCm} &times; ${widthCm} cm`;
    }
}

// ============================================================
//  BAGIAN 7 — BOOTSTRAP
//  Tunggu event 'modelLoaded' dari loadModel.js.
// ============================================================
window.addEventListener('modelLoaded', () => {
    if (window.saunaModel) initScaleController(window.saunaModel);
});
