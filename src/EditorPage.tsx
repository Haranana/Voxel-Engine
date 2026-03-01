
import { useState } from 'react';
import '../src/Editor.css'
import EditorCanvas from './editorWidgets/EditorCanvas'
import RenderableObjectProperties from './editorWidgets/RenderableObjectProperties'
import type { ObjectProperties } from './RenderableObjectTypes';
import { Vector2 } from './math/vector2.type';

export default function EditorPage(){
    const [selectedObject, setSelectedObject] = useState<ObjectProperties | null >( {
        translation: new Vector2(0,0),
        scale: new Vector2(1,1),
        rotation: 0, //in degrees
    });

    const onSelectedObjectPropertiesChanged = (newProp: ObjectProperties) => {
        setSelectedObject(newProp);
        console.log(newProp);
    }

    return <div className="EditorPage">
        <EditorCanvas objectProperties={selectedObject}  ></EditorCanvas>
        {selectedObject == null? "" : <RenderableObjectProperties 
        objectProperties={selectedObject} 
        onPropertiesChange={onSelectedObjectPropertiesChanged}>
            </RenderableObjectProperties>}

    </div>
}