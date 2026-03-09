
import { useState } from 'react';
import '../src/Editor.css'
import EditorCanvas from './editorWidgets/EditorCanvas'
import RenderableObjectProperties from './editorWidgets/RenderableObjectProperties'
import type { ObjectProperties } from './RenderableObjectTypes';
import { Vector3 } from './math/vector3.type';
import type { Camera } from './classes/camera';
import { degreeToRadians } from './math/utils';
import CameraPropertiesWidget from './editorWidgets/CameraPropertiesWidget';

export default function EditorPage(){
    const [selectedObjectProperties, setSelectedObjectProperties] = useState<ObjectProperties | null >( {
        translation: new Vector3(0,0,-500),
        scale: new Vector3(1,1,1),
        rotation: new Vector3(0,0,0), //in degrees
    });

    const [selectedCamera, setSelectedCamera] = useState<Camera>({
        fovY: 90,
        near: 0.1,
        far: 1000,
        transform: {
            translation: new Vector3(0,0,0),
            scale: new Vector3(1,1,1),
            rotation: new Vector3(0,0,0),
        },
        projectionType: "orthographic",
    })

    const onSelectedObjectPropertiesChanged = (newProp: ObjectProperties) => {
        setSelectedObjectProperties(newProp);
    }

    const onSelectedCameraPropertiesChanged = (newCamera: Camera) =>{
        setSelectedCamera(newCamera)
    }

    return <div className="EditorPage">
        <CameraPropertiesWidget camera={selectedCamera} onCameraChange={onSelectedCameraPropertiesChanged}></CameraPropertiesWidget>
        <EditorCanvas objectProperties={selectedObjectProperties} camera={selectedCamera}  ></EditorCanvas>
        {selectedObjectProperties == null? "" : <RenderableObjectProperties 
        objectProperties={selectedObjectProperties} 
        onPropertiesChange={onSelectedObjectPropertiesChanged}>
            </RenderableObjectProperties>}

    </div>
}