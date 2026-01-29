import * as THREE from 'three';
import { showExterior, showInterior } from './textureVariantController.js';

export function initController(model) {
    const sliderX = document.getElementById('sliderX');
    const sliderY = document.getElementById('sliderY');

    const groups = {
        backWall: model.getObjectByName('backWall_Group'),
        frontWall: model.getObjectByName('frontWall_Group'),
        rightWall: model.getObjectByName('rightWall_Group'),
        leftWall: model.getObjectByName('leftWall_Group'),
        door: model.getObjectByName('doorGroup'),
        benchA: model.getObjectByName('benchA_Group'),
        benchB: model.getObjectByName('benchB_group'),
        ofen: model.getObjectByName('ofenGroup'),
        roof: model.getObjectByName('roofGroup')
    };

    const initialPos = new Map();
    const groupKeys = ['backWall_Group', 'frontWall_Group', 'rightWall_Group', 'leftWall_Group', 'doorGroup', 'benchA_Group', 'benchB_group', 'ofenGroup'];
    
    groupKeys.forEach(name => {
        const obj = model.getObjectByName(name);
        if (obj) initialPos.set(name, { x: obj.position.x, y: obj.position.y, z: obj.position.z });
    });

    // Take the initial mesh position inside the roof specifically.
    if (groups.roof) {
        groups.roof.traverse(c => {
            if (c.isMesh) initialPos.set(c.name, { x: c.position.x, y: c.position.y, z: c.position.z });
        });
    }

    // Material Setup (Clone agar variant tidak tabrakan)
    const maps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap'];
    model.traverse((child) => {
        if (child.isMesh && child.material) {
            child.material = child.material.clone();
            maps.forEach(m => {
                if (child.material[m]) {
                    child.material[m] = child.material[m].clone();
                    child.material[m].wrapS = child.material[m].wrapT = THREE.RepeatWrapping;
                }
            });
        }
    });

    function updateMeshUV(obj, u, v) {
        obj.traverse(child => {
            if (child.isMesh && child.material) {
                maps.forEach(m => {
                    if (child.material[m]) { child.material[m].repeat.set(u, v); child.material[m].needsUpdate = true; }
                });
            }
        });
    }

    function updateConfiguration() {
        const sX = parseFloat(sliderX.value);
        const sY = parseFloat(sliderY.value);
        const realWidth = sX * 2;
        const realDepth = sY * 2;

        document.getElementById('valX').innerText = realWidth.toFixed(2) + " m";
        document.getElementById('valY').innerText = realDepth.toFixed(2) + " m";

        // --- Scale Tolerance ---
        const LIMIT_X = 2.5; 
        const LIMIT_Y = 2.3; 

        const tol_Wall_X = (realWidth > LIMIT_X) ? 0.02 : 0;
        const tol_Wall_Y = (realDepth > LIMIT_Y) ? -0.015 : 0; 
        const tol_Roof_X = (realWidth > LIMIT_X) ? -0.02 : 0; 
        const tol_Roof_Y = (realDepth > LIMIT_Y) ? 0.05 : 0;
        
        const fWallX = sX + tol_Wall_X;
        const fWallY = sY + tol_Wall_Y;
        const fRoofX = sX + tol_Roof_X;
        const fRoofY = sY + tol_Roof_Y;

        // Apply Walls
        if (groups.backWall) {
            groups.backWall.scale.x = fWallX;
            groups.backWall.position.z = initialPos.get('backWall_Group').z * sY;
            updateMeshUV(groups.backWall, fWallX, sY);
        }
        if (groups.frontWall) {
            groups.frontWall.position.z = initialPos.get('frontWall_Group').z * sY;
            groups.frontWall.traverse(c => {
                if (c.name.includes('wall_F')) { c.scale.x = fWallX; updateMeshUV(c, fWallX, sY); }
            });
        }
        if (groups.rightWall) {
            groups.rightWall.scale.z = fWallY; 
            groups.rightWall.position.x = initialPos.get('rightWall_Group').x * sX;
            updateMeshUV(groups.rightWall, fWallY, sX);
        }
        if (groups.leftWall) {
            groups.leftWall.scale.z = fWallY;
            groups.leftWall.position.x = initialPos.get('leftWall_Group').x * sX;
            updateMeshUV(groups.leftWall, fWallY, sX);
        }

        // Apply Roof
        if (groups.roof) {
            groups.roof.children.forEach(c => {
                const n = c.name;
                if (n.includes('roof_exterior') || n.includes('roof_interior')) {
                    c.scale.set(sX, sY, sY);
                    updateMeshUV(c, sY, sX);
                } else if (n.includes('roofWood_B') || n.includes('roofWood_F')) {
                    c.scale.x = fRoofX;
                    c.position.z = initialPos.get(n.includes('_B') ? 'backWall_Group' : 'frontWall_Group').z * sY;
                    updateMeshUV(c, fRoofX, 1);
                } else if (n.includes('roofWood_L') || n.includes('roofWood_R')) {
                    c.position.x = initialPos.get(n.includes('_L') ? 'leftWall_Group' : 'rightWall_Group').x * sX;
                    c.scale.z = fRoofY;
                    updateMeshUV(c, fRoofY, 1);
                }
            });
        }

        // Glass Scale Adjusment
        const scaleKomp = (0.978 * fWallX - 0.333) / (0.978 - 0.333);
        model.traverse(c => { if(c.name.includes('wall_FL') || c.name.includes('wall_FR')) c.scale.x = scaleKomp; });
        if (groups.door) groups.door.position.z = initialPos.get('doorGroup').z * sY;

        // Furniture
        if(groups.benchA) {
            groups.benchA.position.z = initialPos.get('benchA_Group').z + ((initialPos.get('backWall_Group').z * sY) - initialPos.get('backWall_Group').z);
            groups.benchA.traverse(c => { if(c.name.includes('main')) c.scale.x = sX; });
        }
    }

    // EVENT LISTENERS
    sliderX.oninput = updateConfiguration;
    sliderY.oninput = updateConfiguration;

    // Texture Buttons
    document.querySelectorAll('.tex-btn').forEach(btn => {
        btn.onclick = () => {
            const [type, variant] = btn.id.split('_'); // ext_A -> ['ext', 'A']
            if(type === 'ext') showExterior(model, variant);
            if(type === 'int') showInterior(model, variant);
            updateConfiguration();
        };
    });

    // Tab Buttons (Fix SwitchMenu Error) / error handling
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            const menuId = btn.id.replace('btn-', '') + 'Menu';
            if (typeof window.switchMenu === 'function') {
                window.switchMenu(menuId);
            }
        };
    });

    // Init
    setTimeout(() => { showExterior(model, 'A'); showInterior(model, 'A'); updateConfiguration(); }, 100);
}