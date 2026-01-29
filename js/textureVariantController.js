const ext_A = ["wall_B_exterior_A", "wall_FL_exterior_A", "wall_FR_exterior_A", "wall_L_exterior_A", "wall_R_exterior_A", "roof_exterior_A"];
const ext_B = ["wall_B_exterior_B", "wall_FL_exterior_B", "wall_FR_exterior_B", "wall_L_exterior_B", "wall_R_exterior_B", "roof_exterior_B"];
const ext_C = ["wall_B_exterior_C", "wall_FL_exterior_C", "wall_FR_exterior_C", "wall_L_exterior_C", "wall_R_exterior_C", "roof_exterior_C"];

const int_A = ["wall_B_interior_A", "wall_FL_interior_A", "wall_FR_interior_A", "wall_L_interior_A", "wall_R_interior_A", "benchB_woodDown_A", "benchB_woodTop_A"];
const int_B = ["wall_B_interior_B", "wall_FL_interior_B", "wall_FR_interior_B", "wall_L_interior_B", "wall_R_interior_B", "benchB_woodDown_B", "benchB_woodTop_B"];
const int_C = ["wall_B_interior_C", "wall_FL_interior_C", "wall_FR_interior_C", "wall_L_interior_C", "wall_R_interior_C", "benchB_woodDown_C", "benchB_woodTop_C"];

function setVisibility(model, list, isVisible) {
    list.forEach(name => {
        const mesh = model.getObjectByName(name);
        if (mesh) mesh.visible = isVisible;
    });
}

export function showExterior(model, variant) {
    setVisibility(model, ext_A, variant === 'A');
    setVisibility(model, ext_B, variant === 'B');
    setVisibility(model, ext_C, variant === 'C');
    
    // Khusus roofWood di dalam roofGroup
    const roofGroup = model.getObjectByName('roofGroup');
    if (roofGroup) {
        roofGroup.children.forEach(c => {
            if (c.name.includes("roofWood")) {
                c.visible = c.name.endsWith("_" + variant);
            }
        });
    }
}

export function showInterior(model, variant) {
    setVisibility(model, int_A, variant === 'A');
    setVisibility(model, int_B, variant === 'B');
    setVisibility(model, int_C, variant === 'C');
}