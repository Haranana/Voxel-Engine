
import { useState } from 'react';
import '../src/Editor.css'
import EditorCanvas from './editorWidgets/EditorCanvas'
import RenderableObjectProperties from './editorWidgets/RenderableObjectProperties'
import { type RenderMode, type ObjectProperties } from './RenderableObjectTypes';
import { Vector3 } from './math/vector3.type';
import type { Camera } from './classes/camera';
import CameraPropertiesWidget from './editorWidgets/CameraPropertiesWidget';
import { VoxelObject } from './classes/voxelObject';
import { getBasicSampleVoxelObject } from './sampleObjects';
import ResizableContainer from './editorWidgets/ResizableContainer';

export default function EditorPage(){
    const [selectedObjectProperties, setSelectedObjectProperties] = useState<ObjectProperties | null >( {
        translation: new Vector3(0,0,-500),
        scale: new Vector3(1,1,1),
        rotation: new Vector3(0,0,0), //in degrees
    });

    const [selectedObject, setSelectedObject] = useState<VoxelObject>(getBasicSampleVoxelObject());
    const [selectedRenderMode, setSelectedRenderMode] = useState<RenderMode>("TriangleWireframe");

    const [selectedCamera, setSelectedCamera] = useState<Camera>({
        fovY: 90,
        near: 0.1,
        far: 1000,
        transform: {
            translation: new Vector3(0,0,0),
            scale: new Vector3(1,1,1),
            rotation: new Vector3(0,0,0),
        },
        projectionType: "perspective",
    })

    const onSelectedObjectChanged = (newObject: VoxelObject) => {
        console.log("[EditorPage] called onSelectedObjectChanged")
        setSelectedObject(newObject);
    }

    const onSelectedObjectPropertiesChanged = (newProp: ObjectProperties) => {
         setSelectedObjectProperties(newProp);
    }

    const onSelectedCameraPropertiesChanged = (newCamera: Camera) =>{
        setSelectedCamera(newCamera)
    }

    return <div className="EditorPage" >
        <ResizableContainer
            child = {null}
            defaultWidth = {200}
            isWidthChangeable = {true}
            minWidth = {50}
            maxWidth = {500}
            defaultHeight = {300}
            isHeightChangeable = {true}
            minHeight = {100}
            maxHeight = {500}
            hasRightHandle={true}
            hasLeftHandle={true}
            hasBottomHandle={true}
            hasTopHandle={true}
        />
        <CameraPropertiesWidget camera={selectedCamera} onCameraChange={onSelectedCameraPropertiesChanged}></CameraPropertiesWidget>
        <EditorCanvas objectProperties={selectedObjectProperties} 
                    camera={selectedCamera} 
                    onSelectedObjectChanged={onSelectedObjectChanged}
                    selectedObject={selectedObject} 
                    renderMode={selectedRenderMode}  
                    ></EditorCanvas>
        {selectedObjectProperties == null? "" : <RenderableObjectProperties 
        objectProperties={selectedObjectProperties} 
        onPropertiesChange={onSelectedObjectPropertiesChanged}>
            </RenderableObjectProperties>}

    </div>
}