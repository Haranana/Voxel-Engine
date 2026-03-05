
import { useState } from 'react';
import '../src/Editor.css'
import EditorCanvas from './editorWidgets/EditorCanvas'
import RenderableObjectProperties from './editorWidgets/RenderableObjectProperties'
import type { ObjectProperties } from './RenderableObjectTypes';
import { Vector2 } from './math/vector2.type';
import { Vector3 } from './math/vector3.type';

export default function EditorPage(){
    const [selectedObjectProperties, setSelectedObjectProperties] = useState<ObjectProperties | null >( {
        translation: new Vector3(0,0,0),
        scale: new Vector3(1,1,1),
        rotation: new Vector3(0,0,0), //in degrees
    });

    const onSelectedObjectPropertiesChanged = (newProp: ObjectProperties) => {
        setSelectedObjectProperties(newProp);
        console.log(newProp);
    }

    return <div className="EditorPage">
        <EditorCanvas objectProperties={selectedObjectProperties}  ></EditorCanvas>
        {selectedObjectProperties == null? "" : <RenderableObjectProperties 
        objectProperties={selectedObjectProperties} 
        onPropertiesChange={onSelectedObjectPropertiesChanged}>
            </RenderableObjectProperties>}

    </div>
}