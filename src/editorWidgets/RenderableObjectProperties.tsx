import { Vector3 } from "../math/vector3.type";
import type { ObjectProperties } from "../RenderableObjectTypes";

export type RenderableObjectPropertiesInput = {
    objectProperties: ObjectProperties,
    onPropertiesChange: (ob: ObjectProperties) => void,
}

export default function RenderableObjectProperties(props : RenderableObjectPropertiesInput){

    const selectedObjectProperties = props.objectProperties;
    
    const onObjectTranslationXChange = (newVal: number) => {
        props.onPropertiesChange({...selectedObjectProperties, translation: new Vector3(newVal, selectedObjectProperties.translation.y, selectedObjectProperties.translation.z)});
    }

    const onObjectTranslationYChange = (newVal: number) => {
        props.onPropertiesChange({...selectedObjectProperties, translation: new Vector3(selectedObjectProperties.translation.x, newVal, selectedObjectProperties.translation.z)});
    }

    const onObjectTranslationZChange = (newVal: number) => {
        props.onPropertiesChange({...selectedObjectProperties, translation: new Vector3(selectedObjectProperties.translation.x, selectedObjectProperties.translation.y, newVal)});
    }

    const onObjectScaleXChange = (newVal: number) => {
        props.onPropertiesChange({...selectedObjectProperties, scale: new Vector3(newVal, selectedObjectProperties.scale.y, selectedObjectProperties.scale.z)});
    }

    const onObjectScaleYChange = (newVal: number) => {
        props.onPropertiesChange({...selectedObjectProperties, scale: new Vector3(selectedObjectProperties.scale.x, newVal, selectedObjectProperties.scale.z)});
    }

    const onObjectScaleZChange = (newVal: number) => {
        props.onPropertiesChange({...selectedObjectProperties, scale: new Vector3(selectedObjectProperties.scale.x, selectedObjectProperties.scale.y, newVal)});
    }

    const onObjectRotationXChange = (newVal: number) => {
        props.onPropertiesChange({...selectedObjectProperties, rotation: new Vector3(newVal, selectedObjectProperties.rotation.y, selectedObjectProperties.rotation.z)});
    }

    const onObjectRotationYChange = (newVal: number) => {
        props.onPropertiesChange({...selectedObjectProperties, rotation: new Vector3(selectedObjectProperties.rotation.x, newVal, selectedObjectProperties.rotation.z)});
    }

    const onObjectRotationZChange = (newVal: number) => {
        props.onPropertiesChange({...selectedObjectProperties, rotation: new Vector3(selectedObjectProperties.rotation.x, selectedObjectProperties.rotation.y, newVal)});
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
                <div className="TranslationZ">
                    <p className="InputValue">Translation Z: {selectedObjectProperties.translation.z}</p>
                    <input className="Input" defaultValue={selectedObjectProperties.translation.z} type='range' min='-1000' max='1000' step='5' onChange={e=>(onObjectTranslationZChange(parseFloat(e.target.value)))}></input>
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
                                <div className="ScaleY">
                    <p className="InputValue">Scale Z: {selectedObjectProperties.scale.z}</p>
                    <input className="Input" defaultValue={selectedObjectProperties.scale.z} type='range' min='0' max='3' step='0.01' onChange={e=>(onObjectScaleZChange(parseFloat(e.target.value)))}></input>
                </div>
            </div>
                    <div className="Rotation WidgetSubsection">
                <div className="RotationX">
                    <p className="InputValue">Rotation X: {selectedObjectProperties.rotation.x}</p>
                    <input className="Input" defaultValue={selectedObjectProperties.rotation.x} type='range' min='0' max='360' step='1' onChange={e=>(onObjectRotationXChange(parseFloat(e.target.value)))}></input>
                </div>
                                <div className="RotationY">
                    <p className="InputValue">Rotation Y: {selectedObjectProperties.rotation.y}</p>
                    <input className="Input" defaultValue={selectedObjectProperties.rotation.y} type='range' min='0' max='360' step='1' onChange={e=>(onObjectRotationYChange(parseFloat(e.target.value)))}></input>
                </div>
                                <div className="RotationZ">
                    <p className="InputValue">Rotation Z: {selectedObjectProperties.rotation.z}</p>
                    <input className="Input" defaultValue={selectedObjectProperties.rotation.z} type='range' min='0' max='360' step='1' onChange={e=>(onObjectRotationZChange(parseFloat(e.target.value)))}></input>
                </div>
            </div>
        </div>
    </div>
}