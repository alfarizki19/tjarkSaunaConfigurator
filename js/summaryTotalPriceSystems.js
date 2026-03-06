// ============================================================
//  summaryTotalPriceSystems.js — Tjark Sauna Configurator
//  Total Price Calculation System
//
//  Sumber harga: pricingData.json (di-mirror sebagai konstanta)
//  Input state : window.updateTotalPrice() dipanggil dari
//                hideAndShowObject.js setelah setiap button klik
//  Input dimensi: dibaca langsung dari slider #lengthInput / #widthInput
//
//  Output DOM:
//    • #totalPrice               — sidebar footer
//    • .summary-total-amount     — summary modal footer
//    • #summaryItems_Dimension   — dimensi + harga ukuran di summary
// ============================================================


// ============================================================
//  PRICING TABLE  (mirrored from pricingData.json)
//
//  Cabin size : area-based → lengthM × widthM × PRICE_SIZE_RATE
//               sehingga harga naik proporsional saat slider digeser
// ============================================================
const PRICE_SIZE_RATE = 2000;   // €/m²

const PRICE_FACADE = {
    1: 1000,    // Wood Facade
    2: 1500,    // Glass Facade
};

const PRICE_FRONT_GLASS = {
    1: 750,     // Front Glass A — hanya aktif ketika facade = Glass
    2: 950,     // Front Glass B
};

const PRICE_EXTERIOR = {
    1: 500,     // Wood A
    2: 400,     // Wood B
    3: 750,     // Wood C
};

const PRICE_INTERIOR = {
    1: 500,     // Wood A
    2: 400,     // Wood B
    3: 750,     // Wood C
};

const PRICE_OVEN = {
    1: 850,     // Oven A
    2: 1250,    // Oven B
};

const PRICE_BENCH = {
    1: 450,     // Wood A
    2: 350,     // Wood B
    3: 650,     // Wood C
};

const PRICE_DOOR_GLASS = {
    1: 750,     // Glass A
    2: 950,     // Glass B
};

const PRICE_DOOR_HANDLE = {
    1: 350,     // Handle A
    2: 550,     // Handle B
};

const PRICE_DOOR_HINGE = {
    1: 250,     // Hinge A
    2: 300,     // Hinge B
};


// ============================================================
//  CURRENT STATE
//  Disinkronkan dari hideAndShowObject.js via window.updateTotalPrice()
//  Default value = state awal hideAndShowObject.js (semua = 1)
// ============================================================
const _state = {
    facade:      1,
    exterior:    1,
    interior:    1,
    facadeGlass: 1,
    oven:        1,
    bench:       1,
    doorGlass:   1,
    doorHandle:  1,
    doorHinge:   1,
};


// ============================================================
//  HELPERS
// ============================================================

// Format angka menjadi "€X,XXX" (en-US locale: koma sebagai separator ribuan)
function formatEUR(amount) {
    return '\u20AC' + amount.toLocaleString('en-US');
}

// Baca nilai slider dari DOM, fallback ke nilai default jika elemen tidak ada
function getSliderValue(id, fallback) {
    const el = document.getElementById(id);
    return el ? parseInt(el.value, 10) : fallback;
}


// ============================================================
//  BREAKDOWN CALCULATION
//  Mengembalikan object berisi harga per kategori + total
// ============================================================
function calcBreakdown() {
    const lengthCm = getSliderValue('lengthInput', 200);
    const widthCm  = getSliderValue('widthInput',  200);

    const lengthM  = lengthCm / 100;
    const widthM   = widthCm  / 100;

    // Ukuran — area × rate (harga dasar bangunan)
    const sizePrice = Math.round(lengthM * widthM * PRICE_SIZE_RATE);

    // Facade type (wood atau glass front)
    const facadePrice = PRICE_FACADE[_state.facade] || 0;

    // Front glass — hanya dihitung jika facade = Glass (state 2)
    const frontGlassPrice = _state.facade === 2
        ? (PRICE_FRONT_GLASS[_state.facadeGlass] || 0)
        : 0;

    const exteriorPrice   = PRICE_EXTERIOR[_state.exterior]       || 0;
    const interiorPrice   = PRICE_INTERIOR[_state.interior]       || 0;
    const ovenPrice       = PRICE_OVEN[_state.oven]               || 0;
    const benchPrice      = PRICE_BENCH[_state.bench]             || 0;
    const doorGlassPrice  = PRICE_DOOR_GLASS[_state.doorGlass]    || 0;
    const doorHandlePrice = PRICE_DOOR_HANDLE[_state.doorHandle]  || 0;
    const doorHingePrice  = PRICE_DOOR_HINGE[_state.doorHinge]    || 0;

    const total = sizePrice
        + facadePrice + frontGlassPrice
        + exteriorPrice + interiorPrice
        + ovenPrice + benchPrice
        + doorGlassPrice + doorHandlePrice + doorHingePrice;

    return {
        lengthCm, widthCm,
        sizePrice,
        facadePrice, frontGlassPrice,
        exteriorPrice, interiorPrice,
        ovenPrice, benchPrice,
        doorGlassPrice, doorHandlePrice, doorHingePrice,
        total,
    };
}


// ============================================================
//  DOM UPDATES
// ============================================================

// Update #totalPrice (sidebar footer) dan .summary-total-amount (summary modal)
function updatePriceDOMElements(breakdown) {
    const formatted = formatEUR(breakdown.total);

    const sidebarEl = document.getElementById('totalPrice');
    if (sidebarEl) sidebarEl.textContent = formatted;

    const summaryEl = document.querySelector('.summary-total-amount');
    if (summaryEl) summaryEl.textContent = formatted;
}

// Update baris Dimension di summary modal:
//   • teks nama → "Dimension: 200 cm × 200 cm"
//   • harga     → harga ukuran (area-based)
function updateDimensionRow(lengthCm, widthCm, sizePrice) {
    const nameEl = document.querySelector('#summaryItems_Dimension .summary-item-name');
    if (nameEl) {
        nameEl.innerHTML =
            '<strong>Dimension:</strong> ' + lengthCm + '\u2009cm \u00D7 ' + widthCm + '\u2009cm';
    }

    // Tambahkan atau perbarui .summary-item-price di dalam .summary-item-info
    const infoEl = document.querySelector('#summaryItems_Dimension .summary-item-info');
    if (infoEl) {
        let priceEl = infoEl.querySelector('.summary-item-price');
        if (!priceEl) {
            priceEl = document.createElement('span');
            priceEl.className = 'summary-item-price';
            infoEl.appendChild(priceEl);
        }
        priceEl.textContent = formatEUR(sizePrice);
    }
}


// ============================================================
//  RECALCULATE & RENDER
//  Entry point tunggal untuk semua perubahan state / slider
// ============================================================
function recalculate() {
    const breakdown = calcBreakdown();
    updatePriceDOMElements(breakdown);
    updateDimensionRow(breakdown.lengthCm, breakdown.widthCm, breakdown.sizePrice);
}


// ============================================================
//  PUBLIC API — window.updateTotalPrice
//  Dipanggil oleh hideAndShowObject.js setelah setiap button klik
//  dengan object berisi semua state variable saat ini
// ============================================================
window.updateTotalPrice = function (state) {
    if (state.facade      !== undefined) _state.facade      = state.facade;
    if (state.exterior    !== undefined) _state.exterior    = state.exterior;
    if (state.interior    !== undefined) _state.interior    = state.interior;
    if (state.facadeGlass !== undefined) _state.facadeGlass = state.facadeGlass;
    if (state.oven        !== undefined) _state.oven        = state.oven;
    if (state.bench       !== undefined) _state.bench       = state.bench;
    if (state.doorGlass   !== undefined) _state.doorGlass   = state.doorGlass;
    if (state.doorHandle  !== undefined) _state.doorHandle  = state.doorHandle;
    if (state.doorHinge   !== undefined) _state.doorHinge   = state.doorHinge;
    recalculate();
};


// ============================================================
//  INIT — DOMContentLoaded
// ============================================================
document.addEventListener('DOMContentLoaded', function () {

    // Hook ke slider — recalculate saat nilai berubah (real-time)
    const lengthInput = document.getElementById('lengthInput');
    const widthInput  = document.getElementById('widthInput');
    if (lengthInput) lengthInput.addEventListener('input', recalculate);
    if (widthInput)  widthInput.addEventListener('input', recalculate);

    // Render awal dengan default state (sebelum hideAndShowObject.js mengirim state)
    recalculate();
});
