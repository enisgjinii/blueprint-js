import JSZip from "jszip";
import FileSaver from 'file-saver';

import { BlueprintJS } from './scripts/blueprint.js';
import {
    EVENT_LOADED, EVENT_NOTHING_2D_SELECTED, EVENT_CORNER_2D_CLICKED, EVENT_WALL_2D_CLICKED,
    EVENT_ROOM_2D_CLICKED, EVENT_WALL_CLICKED, EVENT_ROOM_CLICKED, EVENT_NO_ITEM_SELECTED,
    EVENT_ITEM_SELECTED, EVENT_GLTF_READY
} from './scripts/core/events.js';
import { Configuration, configDimUnit, viewBounds, itemStatistics } from './scripts/core/configuration.js';
import { availableDimUnits, dimMeter, TEXTURE_NO_PREVIEW } from './scripts/core/constants.js';
import * as QuickSettings from './bootstrap-ui.js';

import { Dimensioning } from './scripts/core/dimensioning.js';
import { ParametricsInterface } from './scripts/ParametricsInterface.js';

import * as floor_textures_json from './floor_textures.json';
import * as wall_textures_json from './wall_textures.json';
import * as default_room_json from './design.json';

let default_room = JSON.stringify(default_room_json);

let floor_textures = floor_textures_json;//['default'];
let floor_texture_keys = Object.keys(floor_textures);

let wall_textures = wall_textures_json;//['default'];
let wall_texture_keys = Object.keys(wall_textures);

let blueprint3d = null;

let app_parent = document.getElementById('bp3d-js-app');

let configurationHelper = null;
let floorplanningHelper = null;
let roomplanningHelper = null;


let settingsViewer2d = null;
let settingsSelectedCorner = null;
let settingsSelectedWall = null;
let settingsSelectedRoom = null;

let settingsSelectedRoom3D = null;
let settingsSelectedWall3D = null;

let settingsViewer3d = null;
let uxInterface = null;
let materialSettings = null;

let parametricContextInterface = null;
let doorsData = {
    'Door Type 1': { src: 'assets/doors/DoorType1.png', type: 1 },
    'Door Type 2': { src: 'assets/doors/DoorType2.png', type: 2 },
    'Door Type 3': { src: 'assets/doors/DoorType3.png', type: 3 },
    'Door Type 4': { src: 'assets/doors/DoorType4.png', type: 4 },
    'Door Type 5': { src: 'assets/doors/DoorType5.png', type: 5 },
    'Door Type 6': { src: 'assets/doors/DoorType6.png', type: 6 },
};
let doorTypes = Object.keys(doorsData);
let opts = {
    viewer2d: {
        id: 'bp3djs-viewer2d',
        viewer2dOptions: {
            'corner-radius': 12.5,
            'boundary-point-radius': 5.0,
            'boundary-line-thickness': 2.0,
            'boundary-point-color': '#030303',
            'boundary-line-color': '#090909',
            pannable: true,
            zoomable: true,
            scale: false,
            rotate: true,
            translate: true,
            dimlinecolor: '#3E0000',
            dimarrowcolor: '#FF0000',
            dimtextcolor: '#000000',
            pixiAppOptions: {
                resolution: 1,
            },
            pixiViewportOptions: {
                passiveWheel: false,
            }
        },
    },
    viewer3d: {
        id: 'bp3djs-viewer3d',
        viewer3dOptions: {
            occludedWalls: false,
            occludedRoofs: false
        }
    },
    textureDir: "models/textures/",
    widget: false,
    resize: true,
};

function selectFloorTexture(data) {
    let floor_texture_pack;

    if (data.texture) {
        // Called from texture grid
        floor_texture_pack = data.texture;
    } else {
        // Fallback for other calls
        floor_texture_pack = floor_textures[data.value];
    }

    if (floor_texture_pack) {
        // Apply to all rooms by default
        roomplanningHelper.roomTexturePack = floor_texture_pack;
        console.log('Applied floor texture to all rooms:', data.value || 'unknown');

        // Also update the selection-specific controls if they exist
        if (settingsSelectedRoom3D && !settingsSelectedRoom3D.hidden) {
            roomplanningHelper.roomTexturePack = floor_texture_pack;
        }
    }
}

function selectWallTexture(data) {
    let wall_texture_pack;

    if (data.texture) {
        // Called from texture grid
        wall_texture_pack = data.texture;
    } else {
        // Fallback for other calls
        wall_texture_pack = wall_textures[data.value];
    }

    if (wall_texture_pack) {
        // Apply to all walls by default when using the main materials panel
        roomplanningHelper.roomWallsTexturePack = wall_texture_pack;
        console.log('Applied wall texture to all walls:', data.value || 'unknown');

        // Also apply to individual wall if one is selected
        if (settingsSelectedWall3D && !settingsSelectedWall3D.hidden) {
            roomplanningHelper.wallTexturePack = wall_texture_pack;
            console.log('Also applied to selected wall');
        }
    }
}


function selectFloorTextureColor(data) {
    roomplanningHelper.setRoomFloorColor(data);
}

function selectWallTextureColor(data) {

    if (settingsSelectedWall3D._hidden && !settingsSelectedRoom3D._hidden) {
        roomplanningHelper.setRoomWallsTextureColor(data);
    }
    else {
        roomplanningHelper.setWallColor(data);
    }
}

function selectDoorForWall(data) {
    if (!data.index) {
        data = settingsSelectedWall3D.getValue('Door Type');
    }
    let selectedDoor = doorsData[data.value];
    settingsSelectedWall3D.setValue('Door Preview', selectedDoor.src);
}

function addDoorForWall() {
    let data = settingsSelectedWall3D.getValue('Door Type');
    let selectedDoor = doorsData[data.value];
    roomplanningHelper.addParametricDoorToCurrentWall(selectedDoor.type);
    console.log('Added door type:', selectedDoor.type);
}

function switchViewer() {
    blueprint3d.switchView();
    const currentViewEl = document.getElementById('current-view');
    const switchBtn = document.getElementById('switch-view-btn');

    if (blueprint3d.currentView === 2) {
        currentViewEl.textContent = "Floor Planning";
        switchBtn.textContent = "Switch to 3D";
        settingsViewer3d.hide();
        settingsViewer2d.show();

        settingsSelectedWall3D.hide();
        settingsSelectedRoom3D.hide();
        if (parametricContextInterface) {
            parametricContextInterface.destroy();
            parametricContextInterface = null;
        }

    } else if (blueprint3d.currentView === 3) {
        currentViewEl.textContent = "3D Room Planning";
        switchBtn.textContent = "Switch to 2D";
        settingsViewer2d.hide();
        settingsSelectedCorner.hide();
        settingsSelectedWall.hide();
        settingsSelectedRoom.hide();
        settingsViewer3d.show();
    }
}

function switchViewer2DToDraw() {
    blueprint3d.setViewer2DModeToDraw();
}

function switchViewer2DToMove() {
    blueprint3d.setViewer2DModeToMove();
}

function switchViewer2DToTransform() {
    blueprint3d.switchViewer2DToTransform();
}

function loadBlueprint3DDesign(filedata) {
    let reader = new FileReader();
    reader.onload = function (event) {
        let data = event.target.result;
        blueprint3d.model.loadSerialized(data);
    };
    reader.readAsText(filedata);
}

function loadLockedBlueprint3DDesign(filedata) {
    let reader = new FileReader();
    reader.onload = function (event) {
        let data = event.target.result;
        blueprint3d.model.loadLockedSerialized(data);
    };
    reader.readAsText(filedata);
}

function saveBlueprint3DDesign() {
    let data = blueprint3d.model.exportSerialized();
    let a = window.document.createElement('a');
    let blob = new Blob([data], { type: 'text' });
    a.href = window.URL.createObjectURL(blob);
    a.download = 'design.blueprint3d';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function saveBlueprint3D() {
    blueprint3d.roomplanner.exportSceneAsGTLF();
}

function exportDesignAsPackage() {
    function getWallTextureImages(texobject, pre_image_paths) {
        let image_paths = [];
        if (!texobject) {
            return image_paths;
        }
        if (texobject.normalmap && !pre_image_paths.includes(texobject.normalmap)) {
            image_paths.push(texobject.normalmap);
        }
        if (texobject.colormap && !pre_image_paths.includes(texobject.colormap)) {
            image_paths.push(texobject.colormap);
        }
        if (texobject.roughnessmap && !pre_image_paths.includes(texobject.roughnessmap)) {
            image_paths.push(texobject.roughnessmap);
        }
        if (texobject.ambientmap && !pre_image_paths.includes(texobject.ambientmap)) {
            image_paths.push(texobject.ambientmap);
        }
        if (texobject.bumpmap && !pre_image_paths.includes(texobject.bumpmap)) {
            image_paths.push(texobject.bumpmap);
        }
        return image_paths;
    }

    let designFile = blueprint3d.model.exportSerialized();
    let jsonDesignFile = JSON.parse(designFile);
    let floorplan = jsonDesignFile.floorplan || jsonDesignFile.floorplanner;
    let items = jsonDesignFile.items;
    let images = [];
    let models = [];
    let i = 0;
    for (i = 0; i < floorplan.walls.length; i++) {
        let wall = floorplan.walls[i];
        images = images.concat(getWallTextureImages(wall.frontTexture, images));
        images = images.concat(getWallTextureImages(wall.backTexture, images));
    }
    Object.values(floorplan.newFloorTextures).forEach((texturePack) => {
        images = images.concat(getWallTextureImages(texturePack, images));
        console.log("TEXTURE PACK ", texturePack);
    });
    // for (i = 0; i < floorplan.newFloorTextures.length; i++) {
    //     let roomTexture = floorplan.newFloorTextures[i];
    //     console.log(roomTexture);

    // }
    for (i = 0; i < items.length; i++) {
        let item = items[i];
        if (!item.isParametric && !models.includes(item.modelURL)) {
            models.push(item.modelURL);
        }
    }

    let fetched_image_files = [];
    let fetched_model_files = [];

    function writeZip() {
        if (!fetched_image_files.length === images.length && !fetched_model_files.length === models.length) {
            return;
        }
    }

    let zip = new JSZip();
    zip.file('design.blueprint3d', designFile);

    //Adding the zip files from an url
    //Taken from https://medium.com/@joshmarinacci/a-little-fun-with-zip-files-4058812abf92
    for (i = 0; i < images.length; i++) {
        let image_path = images[i];
        const imageBlob = fetch(image_path).then(response => {
            if (response.status === 200) {
                return response.blob();
            }
            return Promise.reject(new Error(response.statusText));
        });
        zip.file(image_path, imageBlob); //, { base64: false }); //, { base64: true }
    }
    for (i = 0; i < models.length; i++) {
        let model_path = models[i];
        const gltfBlob = fetch(model_path).then(response => {
            if (response.status === 200) {
                return response.blob();
            }
            return Promise.reject(new Error(response.statusText));
        });
        zip.file(model_path, gltfBlob); //, { base64: false }); //, { base64: true }
    }
    zip.generateAsync({ type: "blob" }).then(function (content) {
        FileSaver.saveAs(content, "YourBlueprintProject.zip");
    });

    // let a = window.document.createElement('a');
    // let blob = new Blob([zip.toBuffer()], { type: 'octet/stream' });
    // a.href = window.URL.createObjectURL(blob);
    // a.download = 'YourBlueprintProject.zip';
    // document.body.appendChild(a);
    // a.click();
    // document.body.removeChild(a);
}

// document.addEventListener('DOMContentLoaded', function() {
console.log('ON DOCUMENT READY ');


Configuration.setValue(viewBounds, 10000);//In CMS

blueprint3d = new BlueprintJS(opts);
Configuration.setValue(configDimUnit, dimMeter);
Configuration.setValue(itemStatistics, false);

configurationHelper = blueprint3d.configurationHelper;
floorplanningHelper = blueprint3d.floorplanningHelper;
roomplanningHelper = blueprint3d.roomplanningHelper;

blueprint3d.model.addEventListener(EVENT_LOADED, function () { console.log('LOAD SERIALIZED JSON ::: '); });
blueprint3d.floorplanner.addFloorplanListener(EVENT_NOTHING_2D_SELECTED, function () {
    settingsSelectedCorner.hide();
    settingsSelectedWall.hide();
    settingsSelectedRoom.hide();
    settingsViewer2d.hideControl('Delete');
});
blueprint3d.floorplanner.addFloorplanListener(EVENT_CORNER_2D_CLICKED, function (evt) {
    settingsSelectedCorner.show();
    settingsSelectedWall.hide();
    settingsSelectedRoom.hide();
    settingsViewer2d.showControl('Delete');
    settingsSelectedCorner.setValue('cornerElevation', Dimensioning.cmToMeasureRaw(evt.item.elevation));
});
blueprint3d.floorplanner.addFloorplanListener(EVENT_WALL_2D_CLICKED, function (evt) {
    settingsSelectedCorner.hide();
    settingsSelectedWall.show();
    settingsSelectedRoom.hide();
    settingsViewer2d.showControl('Delete');
    settingsSelectedWall.setValue('wallThickness', Dimensioning.cmToMeasureRaw(evt.item.thickness));
});
blueprint3d.floorplanner.addFloorplanListener(EVENT_ROOM_2D_CLICKED, function (evt) {
    settingsSelectedCorner.hide();
    settingsSelectedWall.hide();
    settingsSelectedRoom.show();
    settingsSelectedRoom.setValue('roomName', evt.item.name);
});

blueprint3d.roomplanner.addRoomplanListener(EVENT_ITEM_SELECTED, function (evt) {
    settingsSelectedWall3D.hide();
    settingsSelectedRoom3D.hide();
    let itemModel = evt.itemModel;
    if (parametricContextInterface) {
        parametricContextInterface.destroy();
        parametricContextInterface = null;
    }
    if (itemModel.isParametric) {
        parametricContextInterface = new ParametricsInterface(itemModel.parametricClass, blueprint3d.roomplanner);
    }
});

blueprint3d.roomplanner.addRoomplanListener(EVENT_NO_ITEM_SELECTED, function () {
    settingsSelectedWall3D.hide();
    settingsSelectedRoom3D.hide();
    if (parametricContextInterface) {
        parametricContextInterface.destroy();
        parametricContextInterface = null;
    }
});
blueprint3d.roomplanner.addRoomplanListener(EVENT_WALL_CLICKED, function (evt) {
    settingsSelectedWall3D.show();
    settingsSelectedRoom3D.hide();
    if (parametricContextInterface) {
        parametricContextInterface.destroy();
        parametricContextInterface = null;
    }
});
blueprint3d.roomplanner.addRoomplanListener(EVENT_ROOM_CLICKED, function (evt) {
    settingsSelectedWall3D.hide();
    settingsSelectedRoom3D.show();
    if (parametricContextInterface) {
        parametricContextInterface.destroy();
        parametricContextInterface = null;
    }
});
blueprint3d.roomplanner.addRoomplanListener(EVENT_GLTF_READY, function (evt) {
    let data = evt.gltf;
    let a = window.document.createElement('a');
    let blob = new Blob([data], { type: 'text' });
    a.href = window.URL.createObjectURL(blob);
    a.download = 'design.gltf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

// console.log(default_room);
blueprint3d.model.loadSerialized(default_room);


if (!opts.widget) {
    // Setup navbar event listeners
    document.getElementById('switch-view-btn').onclick = switchViewer;
    document.getElementById('save-btn').onclick = saveBlueprint3DDesign;
    document.getElementById('export-btn').onclick = saveBlueprint3D;

    uxInterface = QuickSettings.create(0, 0, 'Project', document.getElementById('main-controls'));

    // Always visible materials panel
    materialSettings = QuickSettings.create(0, 0, 'Materials & Textures', document.getElementById('main-controls'));

    settingsViewer2d = QuickSettings.create(0, 0, '2D Controls', document.getElementById('viewer-controls'));
    settingsSelectedCorner = QuickSettings.create(0, 0, 'Corner Properties', document.getElementById('selection-controls'));
    settingsSelectedWall = QuickSettings.create(0, 0, 'Wall Properties', document.getElementById('selection-controls'));
    settingsSelectedRoom = QuickSettings.create(0, 0, 'Room Properties', document.getElementById('selection-controls'));

    settingsViewer3d = QuickSettings.create(0, 0, '3D Controls', document.getElementById('viewer-controls'));
    settingsSelectedWall3D = QuickSettings.create(0, 0, 'Wall Materials', document.getElementById('selection-controls'));
    settingsSelectedRoom3D = QuickSettings.create(0, 0, 'Room Materials', document.getElementById('selection-controls'));


    uxInterface.bindDropDown('Units', availableDimUnits, configurationHelper);
    uxInterface.addFileChooser("Load Design", "Load Design", ".blueprint3d", loadBlueprint3DDesign);
    uxInterface.addButton('Export Project', exportDesignAsPackage);
    uxInterface.addButton('Reset Design', blueprint3d.model.reset.bind(blueprint3d.model));

    // Add always-visible texture controls
    materialSettings.addHTML('Quick Apply', '<p><strong>Apply materials to your design:</strong></p><p>• Floor textures apply to all rooms</p><p>• Wall textures apply to all walls</p><p>• Switch to 3D view to see changes</p>');

    materialSettings.addTextureGrid('Floor Textures', floor_textures, (data) => {
        selectFloorTexture(data);
    });
    materialSettings.addColor('Floor Color Tint', floor_textures[floor_texture_keys[0]].color || '#FFFFFF', selectFloorTextureColor);

    materialSettings.addTextureGrid('Wall Textures', wall_textures, (data) => {
        selectWallTexture(data);
    });
    materialSettings.addColor('Wall Color Tint', wall_textures[wall_texture_keys[0]].color || '#FFFFFF', selectWallTextureColor);

    materialSettings.addDropDown('Door Type', doorTypes, selectDoorForWall);
    materialSettings.addImage('Door Preview', doorsData[doorTypes[0]].src, null);
    materialSettings.addButton('Add Door to Selected Wall', addDoorForWall);

    settingsViewer2d.addModeButtons('Drawing Mode', [
        { label: 'Draw', value: 'draw' },
        { label: 'Move', value: 'move' }
    ], (mode) => {
        if (mode === 'draw') switchViewer2DToDraw();
        else if (mode === 'move') switchViewer2DToMove();
    });

    settingsViewer2d.addButton('Transform Mode', switchViewer2DToTransform);
    settingsViewer2d.addButton('Delete Selected', floorplanningHelper.deleteCurrentItem.bind(floorplanningHelper));

    settingsViewer2d.bindBoolean('snapToGrid', configurationHelper.snapToGrid, configurationHelper);
    settingsViewer2d.bindBoolean('directionalDrag', configurationHelper.directionalDrag, configurationHelper);
    settingsViewer2d.bindBoolean('dragOnlyX', configurationHelper.dragOnlyX, configurationHelper);
    settingsViewer2d.bindBoolean('dragOnlyY', configurationHelper.dragOnlyY, configurationHelper);
    settingsViewer2d.bindBoolean('itemStatistics', configurationHelper.itemStatistics, configurationHelper);
    settingsViewer2d.bindRange('snapTolerance', 1, 200, configurationHelper.snapTolerance, 1, configurationHelper);
    settingsViewer2d.bindRange('gridSpacing', 10, 200, configurationHelper.gridSpacing, 1, configurationHelper);
    settingsViewer2d.bindNumber('boundsX', 1, 200, configurationHelper.boundsX, 1, configurationHelper);
    settingsViewer2d.bindNumber('boundsY', 1, 200, configurationHelper.boundsY, 1, configurationHelper);

    settingsSelectedCorner.bindRange('cornerElevation', 1, 500, floorplanningHelper.cornerElevation, 1, floorplanningHelper);
    settingsSelectedWall.bindRange('wallThickness', 0.2, 1, floorplanningHelper.wallThickness, 0.01, floorplanningHelper);
    settingsSelectedRoom.bindText('roomName', floorplanningHelper.roomName, floorplanningHelper);

    // Floor textures with visual grid
    settingsSelectedRoom3D.addTextureGrid('Floor Textures', floor_textures, (data) => {
        selectFloorTexture(data);
    });
    settingsSelectedRoom3D.addColor('Floor Color Tint', floor_textures[floor_texture_keys[0]].color || '#FFFFFF', selectFloorTextureColor);

    // Wall textures for all walls in room
    settingsSelectedRoom3D.addTextureGrid('Wall Textures (All)', wall_textures, (data) => {
        selectWallTexture(data);
    });
    settingsSelectedRoom3D.addColor('Wall Color Tint', wall_textures[wall_texture_keys[0]].color || '#FFFFFF', selectWallTextureColor);

    // Individual wall textures
    settingsSelectedWall3D.addTextureGrid('Wall Texture', wall_textures, (data) => {
        selectWallTexture(data);
    });
    settingsSelectedWall3D.addColor('Wall Color Tint', wall_textures[wall_texture_keys[0]].color || '#FFFFFF', selectWallTextureColor);

    settingsSelectedWall3D.addDropDown('Door Type', doorTypes, selectDoorForWall);
    settingsSelectedWall3D.addImage('Door Preview', doorsData[doorTypes[0]].src, null);
    settingsSelectedWall3D.addButton('Add Door', addDoorForWall);

    settingsViewer3d.addHTML('3D Navigation', '<p><strong>Mouse Controls:</strong></p><p>• Click and drag to rotate view</p><p>• Scroll to zoom in/out</p><p>• Right-click and drag to pan</p><p><strong>Selection:</strong></p><p>• Click walls to select and modify</p><p>• Click rooms to change materials</p><p>• Drag items to reposition</p>');


    settingsViewer2d.hideControl('Delete');


    settingsSelectedCorner.hide();
    settingsSelectedWall.hide();
    settingsSelectedRoom.hide();

    settingsViewer3d.hide();
    settingsSelectedWall3D.hide();
    settingsSelectedRoom3D.hide();
}