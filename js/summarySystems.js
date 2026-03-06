// ============================================================
//  summarySystems.js — Tjark Sauna Configurator
//  Summary Modal — Show/Hide Item Rows
//
//  Setiap pilihan user memiliki element HTML sendiri di summary.
//  Sistem ini menyembunyikan semua pilihan dalam satu grup,
//  lalu menampilkan hanya yang sesuai dengan pilihan aktif.
//
//  Dipanggil dari hideAndShowObject.js setelah setiap button diklik.
//  Format ID: summaryItems_[Category]_[Variant]
// ============================================================

// ============================================================
//  CORE UTILITY
// ============================================================
function showSummaryItem(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
}

function hideSummaryItem(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

// ============================================================
//  ID GROUPS — semua element per kategori
// ============================================================
const SUMMARY_FACADE_IDS      = ['summaryItems_Facade_Wood',    'summaryItems_Facade_Glass'];
const SUMMARY_EXTERIOR_IDS    = ['summaryItems_Exterior_A',     'summaryItems_Exterior_B',    'summaryItems_Exterior_C'];
const SUMMARY_FACADEGLASS_IDS = ['summaryItems_FacadeGlass_A',  'summaryItems_FacadeGlass_B'];
const SUMMARY_INTERIOR_IDS    = ['summaryItems_Interior_A',     'summaryItems_Interior_B',    'summaryItems_Interior_C'];
const SUMMARY_OVEN_IDS        = ['summaryItems_Oven_A',         'summaryItems_Oven_B'];
const SUMMARY_BENCH_IDS       = ['summaryItems_Bench_A',        'summaryItems_Bench_B',       'summaryItems_Bench_C'];
const SUMMARY_DOORGLASS_IDS   = ['summaryItems_DoorGlass_A',    'summaryItems_DoorGlass_B'];
const SUMMARY_DOORHANDLE_IDS  = ['summaryItems_DoorHandle_A',   'summaryItems_DoorHandle_B'];
const SUMMARY_DOORHINGE_IDS   = ['summaryItems_DoorHinge_A',    'summaryItems_DoorHinge_B'];

// ============================================================
//  RESET FUNCTIONS — hide semua item dalam satu grup
// ============================================================
function resetSummary_Facade()      { SUMMARY_FACADE_IDS.forEach(hideSummaryItem);      }
function resetSummary_Exterior()    { SUMMARY_EXTERIOR_IDS.forEach(hideSummaryItem);    }
function resetSummary_FacadeGlass() { SUMMARY_FACADEGLASS_IDS.forEach(hideSummaryItem); }
function resetSummary_Interior()    { SUMMARY_INTERIOR_IDS.forEach(hideSummaryItem);    }
function resetSummary_Oven()        { SUMMARY_OVEN_IDS.forEach(hideSummaryItem);        }
function resetSummary_Bench()       { SUMMARY_BENCH_IDS.forEach(hideSummaryItem);       }
function resetSummary_DoorGlass()   { SUMMARY_DOORGLASS_IDS.forEach(hideSummaryItem);   }
function resetSummary_DoorHandle()  { SUMMARY_DOORHANDLE_IDS.forEach(hideSummaryItem);  }
function resetSummary_DoorHinge()   { SUMMARY_DOORHINGE_IDS.forEach(hideSummaryItem);   }

// ============================================================
//  VARIANT HELPERS
// ============================================================
const variantABC = (v) => ['A', 'B', 'C'][v - 1];
const variantAB  = (v) => v === 1 ? 'A' : 'B';

// ============================================================
//  UPDATE FUNCTIONS
//  Dipanggil dari hideAndShowObject.js setelah setiap klik tombol.
//  Flow: reset grup → show item yang sesuai
// ============================================================

// summaryUpdate_Facade(facadeVal, extVal, glsVal)
//   facadeVal : 1=Wood, 2=Glass
//   extVal    : 1/2/3 — Exterior Wood selalu ditampilkan
//   glsVal    : 1/2   — FacadeGlass hanya ditampilkan saat facadeVal=2
function summaryUpdate_Facade(facadeVal, extVal, glsVal) {
    resetSummary_Facade();
    resetSummary_Exterior();
    resetSummary_FacadeGlass();

    // Facade type label
    if (facadeVal === 1) {
        showSummaryItem('summaryItems_Facade_Wood');
    } else {
        showSummaryItem('summaryItems_Facade_Glass');
    }

    // Exterior Wood selalu tampil (sama seperti section wood di menu exterior)
    showSummaryItem('summaryItems_Exterior_' + variantABC(extVal));

    // FacadeGlass hanya tampil jika facade=Glass (tambahan di bawah wood)
    if (facadeVal === 2) {
        showSummaryItem('summaryItems_FacadeGlass_' + variantAB(glsVal));
    }
}

// summaryUpdate_Exterior(extVal, facadeVal, glsVal)
//   extVal    : 1/2/3 — pilihan exterior wood (selalu ditampilkan)
//   facadeVal : digunakan untuk menentukan apakah FacadeGlass juga perlu ditampilkan
//   glsVal    : nilai facadeGlass saat ini
function summaryUpdate_Exterior(extVal, facadeVal, glsVal) {
    resetSummary_Exterior();

    // Exterior Wood selalu tampil
    showSummaryItem('summaryItems_Exterior_' + variantABC(extVal));

    // FacadeGlass: tidak diubah di sini, visibility-nya tetap sesuai state facade
}

// summaryUpdate_FacadeGlass(glsVal)
//   glsVal : 1=Glass A, 2=Glass B
function summaryUpdate_FacadeGlass(glsVal) {
    resetSummary_FacadeGlass();
    showSummaryItem('summaryItems_FacadeGlass_' + variantAB(glsVal));
}

// summaryUpdate_Interior(intVal)
//   intVal : 1/2/3
function summaryUpdate_Interior(intVal) {
    resetSummary_Interior();
    showSummaryItem('summaryItems_Interior_' + variantABC(intVal));
}

// summaryUpdate_Oven(ovenVal)
//   ovenVal : 1=Oven A, 2=Oven B
function summaryUpdate_Oven(ovenVal) {
    resetSummary_Oven();
    showSummaryItem('summaryItems_Oven_' + variantAB(ovenVal));
}

// summaryUpdate_Bench(benchVal)
//   benchVal : 1/2/3
function summaryUpdate_Bench(benchVal) {
    resetSummary_Bench();
    showSummaryItem('summaryItems_Bench_' + variantABC(benchVal));
}

// summaryUpdate_DoorGlass(val)
function summaryUpdate_DoorGlass(val) {
    resetSummary_DoorGlass();
    showSummaryItem('summaryItems_DoorGlass_' + variantAB(val));
}

// summaryUpdate_DoorHandle(val)
function summaryUpdate_DoorHandle(val) {
    resetSummary_DoorHandle();
    showSummaryItem('summaryItems_DoorHandle_' + variantAB(val));
}

// summaryUpdate_DoorHinge(val)
function summaryUpdate_DoorHinge(val) {
    resetSummary_DoorHinge();
    showSummaryItem('summaryItems_DoorHinge_' + variantAB(val));
}

// ============================================================
//  DEFAULT STATE — diterapkan saat DOMContentLoaded
//  Sesuai dengan state awal hideAndShowObject.js (semua = 1)
// ============================================================
function applyDefaultSummaryState() {
    summaryUpdate_Facade(1, 1, 1);
    summaryUpdate_Interior(1);
    summaryUpdate_Oven(1);
    summaryUpdate_Bench(1);
    summaryUpdate_DoorGlass(1);
    summaryUpdate_DoorHandle(1);
    summaryUpdate_DoorHinge(1);
}

document.addEventListener('DOMContentLoaded', applyDefaultSummaryState);

// ============================================================
//  EXPOSE TO GLOBAL SCOPE
//  Dipanggil oleh hideAndShowObject.js dari button click handlers
// ============================================================
window.summaryUpdate_Facade      = summaryUpdate_Facade;
window.summaryUpdate_Exterior    = summaryUpdate_Exterior;
window.summaryUpdate_FacadeGlass = summaryUpdate_FacadeGlass;
window.summaryUpdate_Interior    = summaryUpdate_Interior;
window.summaryUpdate_Oven        = summaryUpdate_Oven;
window.summaryUpdate_Bench       = summaryUpdate_Bench;
window.summaryUpdate_DoorGlass   = summaryUpdate_DoorGlass;
window.summaryUpdate_DoorHandle  = summaryUpdate_DoorHandle;
window.summaryUpdate_DoorHinge   = summaryUpdate_DoorHinge;
