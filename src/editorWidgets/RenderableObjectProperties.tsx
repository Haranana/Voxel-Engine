import { degreeToRadians } from "../math/utils";
import { Vector2 } from "../math/vector2.type";
import type { ObjectProperties } from "../RenderableObjectTypes";

export type RenderableObjectPropertiesInput = {
    objectProperties: ObjectProperties,
    onPropertiesChange: (ob: ObjectProperties) => void,
}

export default function RenderableObjectProperties(props : RenderableObjectPropertiesInput){

    const selectedObjectProperties = props.objectProperties;
    
    const onObjectTranslationXChange = (newVal: number) => {
        props.onPropertiesChange({...selectedObjectProperties, translation: new Vector2(newVal, selectedObjectProperties.translation.y)});
    }

    const onObjectTranslationYChange = (newVal: number) => {
        props.onPropertiesChange({...selectedObjectProperties, translation: new Vector2(selectedObjectProperties.translation.x, newVal)});
    }

    const onObjectScaleXChange = (newVal: number) => {
        props.onPropertiesChange({...selectedObjectProperties, scale: new Vector2(newVal, selectedObjectProperties.scale.y)});
    }

    const onObjectScaleYChange = (newVal: number) => {
        props.onPropertiesChange({...selectedObjectProperties, scale: new Vector2(selectedObjectProperties.scale.x, newVal)});
    }

    const onObjectRotationChange = (newVal: number) => {
        props.onPropertiesChange({...selectedObjectProperties, rotation: newVal});
    }
    
    return <div className="RenderableObjectProperties EditorWidget">
        <div className="Transform WidgetSection">
            <div className="Translation WidgetSubsection">
                <div className="TranslationX">
                    <p className="InputValue">Translation X: {selectedObjectProperties.translation.x}</p>
                    <input className="Input" defaultValue={selectedObjectProperties.translation.x} type='range' min='-1000' max='1000' step='5' onChange={e=>(onObjectTranslationXChange(parseFloat(e.target.value)))}></input>
                </div>
                <div className="TranslationY">
                    <p className="InputValue">Translation Y: {selectedObjectProperties.translation.y}</p>
                    <input className="Input" defaultValue={selectedObjectProperties.translation.y} type='range' min='-1000' max='1000' step='5' onChange={e=>(onObjectTranslationYChange(parseFloat(e.target.value)))}></input>
                </div>
            </div>
            <div className="Scale WidgetSubsection">
                <div className="ScaleX">
                    <p className="InputValue">Scale X: {selectedObjectProperties.scale.x}</p>
                    <input className="Input" defaultValue={selectedObjectProperties.scale.x} type='range' min='0' max='3' step='0.01' onChange={e=>(onObjectScaleXChange(parseFloat(e.target.value)))}></input>
                </div>
                <div className="ScaleY">
                    <p className="InputValue">Scale Y: {selectedObjectProperties.scale.y}</p>
                    <input className="Input" defaultValue={selectedObjectProperties.scale.y} type='range' min='0' max='3' step='0.01' onChange={e=>(onObjectScaleYChange(parseFloat(e.target.value)))}></input>
                </div>
            </div>
                    <div className="Rotation WidgetSubsection">
                <div className="RotationX">
                    <p className="InputValue">Rotation X: {selectedObjectProperties.rotation}</p>
                    <input className="Input" defaultValue={selectedObjectProperties.rotation} type='range' min='0' max='360' step='1' onChange={e=>(onObjectRotationChange(parseFloat(e.target.value)))}></input>
                </div>
            </div>
        </div>
    </div>
}