// ============================================================
//  menuController.js — Tjark Sauna Configurator
//  SPA Menu Navigation System
//  Pattern: resetMenu → set state → showHideMenu
//  Phase 1: selectItemCard() defined but NOT wired to HTML (dummy cards).
// ============================================================

// --- STATE ---
// 1 = menuCabin, 2 = menuExterior, 3 = menuInterior, 4 = menuItems
let menuOpen = 1;

// --- MENU ID MAP ---
const MENU_IDS = {
    1: {
        sectionId: 'menuCabin',
        navBtnId:  'navBtnCabin',
        title:     'Cabin Configuration',
        desc:      'Adjust the facade style and dimensions of your sauna cabin.'
    },
    2: {
        sectionId: 'menuExterior',
        navBtnId:  'navBtnExterior',
        title:     'Exterior Configuration',
        desc:      'Choose the cladding material for the outside of your sauna.'
    },
    3: {
        sectionId: 'menuInterior',
        navBtnId:  'navBtnInterior',
        title:     'Interior Configuration',
        desc:      'Select bench wood, door glass, and interior finishes.'
    },
    4: {
        sectionId: 'menuItems',
        navBtnId:  'navBtnItems',
        title:     'Items Configuration',
        desc:      'Configure the sauna oven, bench, door handle, and hinges.'
    }
};

// ============================================================
//  resetMenu()
//  Hides ALL .menu-section elements.
//  Removes .active from ALL .nav-btn elements.
// ============================================================
function resetMenu() {
    document.querySelectorAll('.menu-section').forEach(function (section) {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(function (btn) {
        btn.classList.remove('active');
    });
}

// ============================================================
//  showHideMenu()
//  Activates the correct section + nav button + updates header.
// ============================================================
function showHideMenu() {
    var config = MENU_IDS[menuOpen];
    if (!config) return;

    var targetSection = document.getElementById(config.sectionId);
    if (targetSection) targetSection.classList.add('active');

    var targetBtn = document.getElementById(config.navBtnId);
    if (targetBtn) targetBtn.classList.add('active');

    var titleEl = document.getElementById('sectionTitle');
    var descEl  = document.getElementById('sectionDesc');
    if (titleEl) titleEl.textContent = config.title;
    if (descEl)  descEl.textContent  = config.desc;
}

// ============================================================
//  openMenu(id)
//  Public entry point — called from nav button onclick.
//  Sequence: resetMenu → set state → showHideMenu
// ============================================================
function openMenu(id) {
    resetMenu();
    menuOpen = id;
    showHideMenu();
}

// ============================================================
//  openSummary() / closeSummary()
//  Summary modal is not part of the menuOpen flow.
// ============================================================
function openSummary() {
    var overlay = document.getElementById('menuSummary');
    if (overlay) overlay.style.display = 'flex';
}

function closeSummary() {
    var overlay = document.getElementById('menuSummary');
    if (overlay) overlay.style.display = 'none';
}

// ============================================================
//  selectItemCard(clickedBtn, groupName)
//  Defined for future use — NOT called from HTML in Phase 1.
//  IDs and onclick will be wired in a later phase.
// ============================================================
function selectItemCard(clickedBtn, groupName) {
    var cardRow = clickedBtn.closest('.card-row');
    if (!cardRow) return;
    cardRow.querySelectorAll('.item-card').forEach(function (card) {
        card.classList.remove('active');
    });
    clickedBtn.classList.add('active');
}

// ============================================================
//  updateSlider(input, valId, fillId, thumbId)
//  Updates range slider display value, fill bar, and thumb.
//  FUNCTIONAL in Phase 1.
// ============================================================
function updateSlider(input, valId, fillId, thumbId) {
    var percent = ((input.value - input.min) / (input.max - input.min)) * 100;

    var valEl   = document.getElementById(valId);
    var fillEl  = document.getElementById(fillId);
    var thumbEl = document.getElementById(thumbId);

    if (valEl)   valEl.textContent  = input.value;
    if (fillEl)  fillEl.style.width = percent + '%';
    if (thumbEl) thumbEl.style.left = percent + '%';
}

// ============================================================
//  Mobile bottom-sheet collapse/expand
//  Pattern from m4rifleconfigurator: toggle .collapsed on
//  #menuContainer and #menuNav. Header + footer always visible.
//  Model viewer auto-fills via flex:1.
// ============================================================
var sheetCollapsed = false;

function collapseSheet() {
    var menuContainer = document.getElementById('menuContainer');
    var menuNav = document.getElementById('menuNav');
    if (menuContainer) menuContainer.classList.add('collapsed');
    if (menuNav) menuNav.classList.add('collapsed');
    sheetCollapsed = true;
}

function expandSheet() {
    var menuContainer = document.getElementById('menuContainer');
    var menuNav = document.getElementById('menuNav');
    if (menuContainer) menuContainer.classList.remove('collapsed');
    if (menuNav) menuNav.classList.remove('collapsed');
    sheetCollapsed = false;
}

function toggleSheet() {
    if (sheetCollapsed) {
        expandSheet();
    } else {
        collapseSheet();
    }
}

// ============================================================
//  setupDragHandle()
//  Drag header down → collapse, drag up → expand.
//  Also supports tap to toggle.
// ============================================================
function setupDragHandle() {
    var header = document.getElementById('sectionHeader');
    if (!header) return;

    var startY = 0;
    var moved = false;
    var DRAG_THRESHOLD = 30;

    function onStart(clientY) {
        startY = clientY;
        moved = false;
    }

    function onMove(clientY) {
        if (Math.abs(clientY - startY) > 10) {
            moved = true;
        }
    }

    function onEnd(clientY) {
        var delta = clientY - startY;

        if (!moved || Math.abs(delta) < DRAG_THRESHOLD) {
            toggleSheet();
            return;
        }

        if (delta > DRAG_THRESHOLD) {
            collapseSheet();
        } else if (delta < -DRAG_THRESHOLD) {
            expandSheet();
        }
    }

    header.addEventListener('touchstart', function (e) {
        onStart(e.touches[0].clientY);
    }, { passive: true });

    header.addEventListener('touchmove', function (e) {
        onMove(e.touches[0].clientY);
    }, { passive: true });

    header.addEventListener('touchend', function (e) {
        var y = e.changedTouches ? e.changedTouches[0].clientY : startY;
        onEnd(y);
    });

    header.addEventListener('mousedown', function (e) {
        onStart(e.clientY);
        e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
        onMove(e.clientY);
    });

    document.addEventListener('mouseup', function (e) {
        if (startY !== 0) {
            onEnd(e.clientY);
            startY = 0;
        }
    });
}

// ============================================================
//  INIT — DOMContentLoaded
//  Boot: reset all → show default Cabin menu (id = 1)
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    resetMenu();
    menuOpen = 1;
    showHideMenu();

    setupDragHandle();

    // Close summary when clicking overlay background
    var summaryOverlay = document.getElementById('menuSummary');
    if (summaryOverlay) {
        summaryOverlay.addEventListener('click', function (e) {
            if (e.target === summaryOverlay) {
                closeSummary();
            }
        });
    }
});

// Expose to global scope
window.openMenu       = openMenu;
window.openSummary    = openSummary;
window.closeSummary   = closeSummary;
window.selectItemCard = selectItemCard;
window.updateSlider   = updateSlider;
