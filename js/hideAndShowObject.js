// ============================================================
//  hideAndShowObject.js — Tjark Sauna Configurator
//  3D Mesh Visibility Controller
//
//  Flow setiap tombol ditekan:
//    reset() → set variable → systems()
//
//  Menggunakan window.saunaModel yang di-expose oleh loadModel.js
//  Mendengarkan event 'modelLoaded' untuk menerapkan state awal
// ============================================================

// ============================================================
//  STATE VARIABLES
// ============================================================
let facade      = 1;  // 1 = Wood,   2 = Glass
let exterior    = 1;  // 1 = Wood A, 2 = Wood B, 3 = Wood C
let interior    = 1;  // 1 = Wood A, 2 = Wood B, 3 = Wood C
let facadeGlass = 1;  // 1 = Glass A, 2 = Glass B
let oven        = 1;  // 1 = Oven A, 2 = Oven B
let bench       = 1;  // 1 = Wood A, 2 = Wood B, 3 = Wood C
let doorGlass   = 1;  // 1 = Glass A, 2 = Glass B
let doorHandle  = 1;  // 1 = Handle A, 2 = Handle B
let doorHinge   = 1;  // 1 = Hinge A, 2 = Hinge B

// ============================================================
//  CORE UTILITY
// ============================================================
function setVisible(meshName, visible) {
    if (!window.saunaModel) return;
    const obj = window.saunaModel.getObjectByName(meshName);
    if (obj) obj.visible = visible;
}

function showMesh(name) { setVisible(name, true);  }
function hideMesh(name) { setVisible(name, false); }

// ============================================================
//  MESH LISTS
//  Sumber: 3D Model Base Version Mesh Name Data.txt
// ============================================================

// Front wall — wood facade mode
const FACADE_WOOD_MESHES = [
    'wall_FrontLeft_exterior_A',  'wall_FrontLeft_exterior_B',  'wall_FrontLeft_exterior_C',
    'wall_FrontLeft_interior_A',  'wall_FrontLeft_interior_B',  'wall_FrontLeft_interior_C',
    'wall_FrontRight_exterior_A', 'wall_FrontRight_exterior_B', 'wall_FrontRight_exterior_C',
    'wall_FrontRight_interior_A', 'wall_FrontRight_interior_B', 'wall_FrontRight_interior_C',
];

// Front wall — glass facade mode
const FACADE_GLASS_MESHES = [
    'glass_FrontLeft_A',  'glass_FrontLeft_B',
    'glass_FrontRight_A', 'glass_FrontRight_B',
];

// Exterior walls — non-front (back/left/right/roof)
const EXTERIOR_MESHES = [
    'wall_Back_exterior_A',  'wall_Back_exterior_B',  'wall_Back_exterior_C',
    'wall_Left_exterior_A',  'wall_Left_exterior_B',  'wall_Left_exterior_C',
    'wall_Right_exterior_A', 'wall_Right_exterior_B', 'wall_Right_exterior_C',
    'roof_exterior_A',       'roof_exterior_B',       'roof_exterior_C',
    'roofWood_Back_A',       'roofWood_Back_B',       'roofWood_Back_C',
    'roofWood_Front_A',      'roofWood_Front_B',      'roofWood_Front_C',
    'roofWood_Left_A',       'roofWood_Left_B',       'roofWood_Left_C',
    'roofWood_Right_A',      'roofWood_Right_B',      'roofWood_Right_C',
];

// Interior walls — non-front (back/left/right/roof)
const INTERIOR_MESHES = [
    'wall_Back_interior_A',  'wall_Back_interior_B',  'wall_Back_interior_C',
    'wall_Left_interior_A',  'wall_Left_interior_B',  'wall_Left_interior_C',
    'wall_Right_interior_A', 'wall_Right_interior_B', 'wall_Right_interior_C',
    'roof_interior_A',       'roof_interior_B',       'roof_interior_C',
];

// Bench (A and B groups, all wood variants)
const BENCH_MESHES = [
    'benchA_backrest_A',        'benchA_backrest_B',        'benchA_backrest_C',
    'benchA_main_A',            'benchA_main_B',            'benchA_main_C',
    'benchA_wood_center_A',     'benchA_wood_center_B',     'benchA_wood_center_C',
    'benchA_wood_left_A',       'benchA_wood_left_B',       'benchA_wood_left_C',
    'benchA_wood_right_A',      'benchA_wood_right_B',      'benchA_wood_right_C',
    'benchB_backrest_A',        'benchB_backrest_B',        'benchB_backrest_C',
    'benchB_main_A',            'benchB_main_B',            'benchB_main_C',
    'benchB_woodDown_center_A', 'benchB_woodDown_center_B', 'benchB_woodDown_center_C',
    'benchB_woodDown_left_A',   'benchB_woodDown_left_B',   'benchB_woodDown_left_C',
    'benchB_woodDown_right_A',  'benchB_woodDown_right_B',  'benchB_woodDown_right_C',
    'benchB_woodTop_center_A',  'benchB_woodTop_center_B',  'benchB_woodTop_center_C',
    'benchB_woodTop_left_A',    'benchB_woodTop_left_B',    'benchB_woodTop_left_C',
    'benchB_woodTop_right_A',   'benchB_woodTop_right_B',   'benchB_woodTop_right_C',
];

const OVEN_MESHES        = ['ofenA', 'ofenB'];
const DOOR_GLASS_MESHES  = ['doorGlass_A',  'doorGlass_B'];
const DOOR_HANDLE_MESHES = ['doorHandle_A', 'doorHandle_B'];
const DOOR_HINGE_MESHES  = ['doorHinge_A',  'doorHinge_B'];

// ============================================================
//  RESET FUNCTIONS — hide semua mesh dalam satu kelompok
// ============================================================
function resetFacade()      { FACADE_WOOD_MESHES.forEach(hideMesh); }
function resetFacadeGlass() { FACADE_GLASS_MESHES.forEach(hideMesh); }
function resetExterior()    { EXTERIOR_MESHES.forEach(hideMesh); }
function resetInterior()    { INTERIOR_MESHES.forEach(hideMesh); }
function resetBench()       { BENCH_MESHES.forEach(hideMesh); }
function resetOven()        { OVEN_MESHES.forEach(hideMesh); }
function resetDoorGlass()   { DOOR_GLASS_MESHES.forEach(hideMesh); }
function resetDoorHandle()  { DOOR_HANDLE_MESHES.forEach(hideMesh); }
function resetDoorHinge()   { DOOR_HINGE_MESHES.forEach(hideMesh); }

// ============================================================
//  SYSTEM FUNCTIONS — show mesh yang benar berdasarkan state
// ============================================================

// facadeSystems() — mengontrol dinding bagian depan (front wall)
// facade=1 (Wood) : show wall_FrontLeft/Right_exterior + interior sesuai variant
// facade=2 (Glass): show glass_FrontLeft/Right sesuai facadeGlass variant
function facadeSystems() {
    const extV = ['A', 'B', 'C'][exterior - 1];
    const intV = ['A', 'B', 'C'][interior - 1];
    const glsV = ['A', 'B'][facadeGlass - 1];

    if (facade === 1) {
        showMesh('wall_FrontLeft_exterior_'  + extV);
        showMesh('wall_FrontRight_exterior_' + extV);
        showMesh('wall_FrontLeft_interior_'  + intV);
        showMesh('wall_FrontRight_interior_' + intV);
    } else {
        showMesh('glass_FrontLeft_'  + glsV);
        showMesh('glass_FrontRight_' + glsV);
    }
}

// exteriorSystems() — mengontrol dinding eksterior non-depan (back/left/right/roof)
function exteriorSystems() {
    const v = ['A', 'B', 'C'][exterior - 1];
    showMesh('wall_Back_exterior_'  + v);
    showMesh('wall_Left_exterior_'  + v);
    showMesh('wall_Right_exterior_' + v);
    showMesh('roof_exterior_'       + v);
    showMesh('roofWood_Back_'       + v);
    showMesh('roofWood_Front_'      + v);
    showMesh('roofWood_Left_'       + v);
    showMesh('roofWood_Right_'      + v);
}

// interiorSystems() — mengontrol dinding interior non-depan (back/left/right/roof)
function interiorSystems() {
    const v = ['A', 'B', 'C'][interior - 1];
    showMesh('wall_Back_interior_'  + v);
    showMesh('wall_Left_interior_'  + v);
    showMesh('wall_Right_interior_' + v);
    showMesh('roof_interior_'       + v);
}

// benchSystems() — show bench A dan B dengan variant kayu yang dipilih
function benchSystems() {
    const v = ['A', 'B', 'C'][bench - 1];
    showMesh('benchA_backrest_'        + v);
    showMesh('benchA_main_'            + v);
    showMesh('benchA_wood_center_'     + v);
    showMesh('benchA_wood_left_'       + v);
    showMesh('benchA_wood_right_'      + v);
    showMesh('benchB_backrest_'        + v);
    showMesh('benchB_main_'            + v);
    showMesh('benchB_woodDown_center_' + v);
    showMesh('benchB_woodDown_left_'   + v);
    showMesh('benchB_woodDown_right_'  + v);
    showMesh('benchB_woodTop_center_'  + v);
    showMesh('benchB_woodTop_left_'    + v);
    showMesh('benchB_woodTop_right_'   + v);
}

function ovenSystems()       { showMesh(oven       === 1 ? 'ofenA'       : 'ofenB');       }
function doorGlassSystems()  { showMesh('doorGlass_'  + (doorGlass  === 1 ? 'A' : 'B')); }
function doorHandleSystems() { showMesh('doorHandle_' + (doorHandle === 1 ? 'A' : 'B')); }
function doorHingeSystems()  { showMesh('doorHinge_'  + (doorHinge  === 1 ? 'A' : 'B')); }

// ============================================================
//  PRICING NOTIFIER
//  Kirim semua state pilihan ke summaryTotalPriceSystems.js.
//  Dipanggil setelah setiap button klik dan saat default state.
// ============================================================
function notifyPricing() {
    if (window.updateTotalPrice) {
        window.updateTotalPrice({
            facade, exterior, interior, facadeGlass,
            oven, bench, doorGlass, doorHandle, doorHinge,
        });
    }
}

// ============================================================
//  INITIAL STATE — tampilkan default saat model selesai di-load
// ============================================================
function applyDefaultState() {
    resetFacade();
    resetFacadeGlass();
    resetExterior();
    resetInterior();
    resetBench();
    resetOven();
    resetDoorGlass();
    resetDoorHandle();
    resetDoorHinge();

    facadeSystems();
    exteriorSystems();
    interiorSystems();
    benchSystems();
    ovenSystems();
    doorGlassSystems();
    doorHandleSystems();
    doorHingeSystems();
    notifyPricing();
}

// ============================================================
//  BUTTON CLICK HANDLERS
//  Pattern: reset → set variable → systems()
// ============================================================
function setupButtons() {

    const glassGroup = document.getElementById('exteriorGlassGroup');

    // --------------------------------------------------------
    //  CABIN — Front Facade
    // --------------------------------------------------------
    document.getElementById('btn_Facade_Wood').addEventListener('click', () => {
        resetFacade();
        resetFacadeGlass();
        facade = 1;
        facadeSystems();
        glassGroup.style.display = 'none';
        summaryUpdate_Facade(facade, exterior, facadeGlass);
        notifyPricing();
    });

    document.getElementById('btn_Facade_Glass').addEventListener('click', () => {
        resetFacade();
        resetFacadeGlass();
        facade = 2;
        facadeSystems();
        glassGroup.style.display = '';
        summaryUpdate_Facade(facade, exterior, facadeGlass);
        notifyPricing();
    });

    // --------------------------------------------------------
    //  EXTERIOR — Wood Type
    // --------------------------------------------------------
    document.getElementById('btn_Exterior_A').addEventListener('click', () => {
        resetFacade();
        resetFacadeGlass();
        resetExterior();
        exterior = 1;
        facadeSystems();
        exteriorSystems();
        summaryUpdate_Exterior(exterior, facade, facadeGlass);
        notifyPricing();
    });

    document.getElementById('btn_Exterior_B').addEventListener('click', () => {
        resetFacade();
        resetFacadeGlass();
        resetExterior();
        exterior = 2;
        facadeSystems();
        exteriorSystems();
        summaryUpdate_Exterior(exterior, facade, facadeGlass);
        notifyPricing();
    });

    document.getElementById('btn_Exterior_C').addEventListener('click', () => {
        resetFacade();
        resetFacadeGlass();
        resetExterior();
        exterior = 3;
        facadeSystems();
        exteriorSystems();
        summaryUpdate_Exterior(exterior, facade, facadeGlass);
        notifyPricing();
    });

    // --------------------------------------------------------
    //  EXTERIOR — Facade Glass
    // --------------------------------------------------------
    document.getElementById('btn_facadeGlass_A').addEventListener('click', () => {
        resetFacade();
        resetFacadeGlass();
        facadeGlass = 1;
        facadeSystems();
        summaryUpdate_FacadeGlass(facadeGlass);
        notifyPricing();
    });

    document.getElementById('btn_facadeGlass_B').addEventListener('click', () => {
        resetFacade();
        resetFacadeGlass();
        facadeGlass = 2;
        facadeSystems();
        summaryUpdate_FacadeGlass(facadeGlass);
        notifyPricing();
    });

    // --------------------------------------------------------
    //  INTERIOR — Wood Type
    // --------------------------------------------------------
    document.getElementById('btn_Interior_A').addEventListener('click', () => {
        resetFacade();
        resetFacadeGlass();
        resetInterior();
        interior = 1;
        facadeSystems();
        interiorSystems();
        summaryUpdate_Interior(interior);
        notifyPricing();
    });

    document.getElementById('btn_Interior_B').addEventListener('click', () => {
        resetFacade();
        resetFacadeGlass();
        resetInterior();
        interior = 2;
        facadeSystems();
        interiorSystems();
        summaryUpdate_Interior(interior);
        notifyPricing();
    });

    document.getElementById('btn_Interior_C').addEventListener('click', () => {
        resetFacade();
        resetFacadeGlass();
        resetInterior();
        interior = 3;
        facadeSystems();
        interiorSystems();
        summaryUpdate_Interior(interior);
        notifyPricing();
    });

    // --------------------------------------------------------
    //  ITEMS — Oven
    // --------------------------------------------------------
    document.getElementById('btn_oven_A').addEventListener('click', () => {
        resetOven();
        oven = 1;
        ovenSystems();
        summaryUpdate_Oven(oven);
        notifyPricing();
    });

    document.getElementById('btn_oven_B').addEventListener('click', () => {
        resetOven();
        oven = 2;
        ovenSystems();
        summaryUpdate_Oven(oven);
        notifyPricing();
    });

    // --------------------------------------------------------
    //  ITEMS — Bench Wood
    // --------------------------------------------------------
    document.getElementById('btn_bench_A').addEventListener('click', () => {
        resetBench();
        bench = 1;
        benchSystems();
        summaryUpdate_Bench(bench);
        notifyPricing();
    });

    document.getElementById('btn_bench_B').addEventListener('click', () => {
        resetBench();
        bench = 2;
        benchSystems();
        summaryUpdate_Bench(bench);
        notifyPricing();
    });

    document.getElementById('btn_bench_C').addEventListener('click', () => {
        resetBench();
        bench = 3;
        benchSystems();
        summaryUpdate_Bench(bench);
        notifyPricing();
    });

    // --------------------------------------------------------
    //  ITEMS — Door Glass
    // --------------------------------------------------------
    document.getElementById('btn_doorGlass_A').addEventListener('click', () => {
        resetDoorGlass();
        doorGlass = 1;
        doorGlassSystems();
        summaryUpdate_DoorGlass(doorGlass);
        notifyPricing();
    });

    document.getElementById('btn_doorGlass_B').addEventListener('click', () => {
        resetDoorGlass();
        doorGlass = 2;
        doorGlassSystems();
        summaryUpdate_DoorGlass(doorGlass);
        notifyPricing();
    });

    // --------------------------------------------------------
    //  ITEMS — Door Handle
    // --------------------------------------------------------
    document.getElementById('btn_doorHandle_A').addEventListener('click', () => {
        resetDoorHandle();
        doorHandle = 1;
        doorHandleSystems();
        summaryUpdate_DoorHandle(doorHandle);
        notifyPricing();
    });

    document.getElementById('btn_doorHandle_B').addEventListener('click', () => {
        resetDoorHandle();
        doorHandle = 2;
        doorHandleSystems();
        summaryUpdate_DoorHandle(doorHandle);
        notifyPricing();
    });

    // --------------------------------------------------------
    //  ITEMS — Door Hinge
    // --------------------------------------------------------
    document.getElementById('btn_doorHinge_A').addEventListener('click', () => {
        resetDoorHinge();
        doorHinge = 1;
        doorHingeSystems();
        summaryUpdate_DoorHinge(doorHinge);
        notifyPricing();
    });

    document.getElementById('btn_doorHinge_B').addEventListener('click', () => {
        resetDoorHinge();
        doorHinge = 2;
        doorHingeSystems();
        summaryUpdate_DoorHinge(doorHinge);
        notifyPricing();
    });
}

// ============================================================
//  INIT
// ============================================================
function init() {
    setupButtons();

    // Terapkan default state — jika model sudah siap langsung apply,
    // jika belum, tunggu event 'modelLoaded' dari loadModel.js
    if (window.saunaModel) {
        applyDefaultState();
    } else {
        window.addEventListener('modelLoaded', applyDefaultState);
    }
}

document.addEventListener('DOMContentLoaded', init);
