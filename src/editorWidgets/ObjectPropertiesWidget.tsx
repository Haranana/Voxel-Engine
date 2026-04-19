import React from "react";
import { ExpandableRow } from "./ExpandableRow";
import { MutableNumberField } from "./MutableNumberField";
import { Vector3 } from "../math/vector3.type";
import { clamp, mod } from "../math/utils";
import type { ObjectProperties } from "../RenderableObjectTypes";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import "../editorWidgets/ExpandableRow.css"
import "../Editor.css"
import type { VoxelObject } from "../classes/voxelObject";

export type ObjectPropertiesWidgetProps = {
    objectProperties: ObjectProperties;
    onPropertiesChange: React.Dispatch<React.SetStateAction<ObjectProperties>>;

    voxelObject: VoxelObject;
    setVoxelObject: React.Dispatch<React.SetStateAction<VoxelObject>>;

    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function ObjectPropertiesWidget(props: ObjectPropertiesWidgetProps) {
    const { objectProperties, voxelObject } = props;
    const TriggerIcon = props.isOpen ? ChevronDownIcon : ChevronRightIcon;

    const translationMin = -10000;
    const translationMax = 10000;

    const rotationMin = -10000;
    const rotationMax = 10000;

    const sizeMin = 0;

    const updateSize = (newSize: Vector3) => {
        props.setVoxelObject(prev => {
            const copy = prev.copy();
            copy.resize(newSize);
            return copy;
        });
    };

    return (
        <ExpandableRow
            trigger={
                <button type="button" className="ExpandableRowTriggerButton">
                    <TriggerIcon className="ExpandableRowTriggerButtonIcon" />
                    <p className="ExpandableRowTriggerButtonText">Object properties</p>
                </button>
            }
            isOpen={props.isOpen}
            onOpenChange={props.onOpenChange}
        >
            <div className="ExpandableRowChild ObjectProperties">

                <div className="ExpandableRowChildSection ObjectSizeProperties">
                    <p>Size</p>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">X</p>
                        <MutableNumberField
                            value={voxelObject.size.x}
                            minValue={sizeMin}
                            maxValue={voxelObject.maxSize.x}
                            step={1}
                            onStep={(delta) => {
                                updateSize(new Vector3(
                                    voxelObject.size.x + delta,
                                    voxelObject.size.y,
                                    voxelObject.size.z
                                ));
                            }}
                            onAcceptedChange={(value) => {
                                updateSize(new Vector3(
                                    value,
                                    voxelObject.size.y,
                                    voxelObject.size.z
                                ));
                            }}
                            canIncrease
                            canDecrease
                            inputId={"ObjectSizeX"}
                        />
                    </div>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Y</p>
                        <MutableNumberField
                            value={voxelObject.size.y}
                            minValue={sizeMin}
                            maxValue={voxelObject.maxSize.y}
                            step={1}
                            onStep={(delta) => {
                                updateSize(new Vector3(
                                    voxelObject.size.x,
                                    voxelObject.size.y + delta,
                                    voxelObject.size.z
                                ));
                            }}
                            onAcceptedChange={(value) => {
                                updateSize(new Vector3(
                                    voxelObject.size.x,
                                    value,
                                    voxelObject.size.z
                                ));
                            }}
                            canIncrease
                            canDecrease
                            inputId={"ObjectSizeY"}
                        />
                    </div>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Z</p>
                        <MutableNumberField
                            value={voxelObject.size.z}
                            minValue={sizeMin}
                            maxValue={voxelObject.maxSize.z}
                            step={1}
                            onStep={(delta) => {
                                updateSize(new Vector3(
                                    voxelObject.size.x,
                                    voxelObject.size.y,
                                    voxelObject.size.z + delta
                                ));
                            }}
                            onAcceptedChange={(value) => {
                                updateSize(new Vector3(
                                    voxelObject.size.x,
                                    voxelObject.size.y,
                                    value
                                ));
                            }}
                            canIncrease
                            canDecrease
                            inputId={"ObjectSizeZ"}
                        />
                    </div>
                </div>

                <div className="ExpandableRowChildSection ObjectTransformProperties">
                    <p>Position</p>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">X</p>
                        <MutableNumberField
                            value={objectProperties.translation.x}
                            minValue={translationMin}
                            maxValue={translationMax}
                            step={20}
                            onStep={(delta) => {
                                props.onPropertiesChange(prev => ({
                                    ...prev,
                                    translation: new Vector3(
                                        clamp({value: prev.translation.x + delta, min: translationMin, max: translationMax}),
                                        prev.translation.y,
                                        prev.translation.z
                                    ),
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onPropertiesChange(prev => ({
                                    ...prev,
                                    translation: new Vector3(
                                        clamp({value, min: translationMin, max: translationMax}),
                                        prev.translation.y,
                                        prev.translation.z
                                    ),
                                }));
                            }}
                            canIncrease
                            canDecrease
                            inputId={"ObjectTransformX"}
                        />
                    </div>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Y</p>
                        <MutableNumberField
                            value={objectProperties.translation.y}
                            minValue={translationMin}
                            maxValue={translationMax}
                            step={20}
                            onStep={(delta) => {
                                props.onPropertiesChange(prev => ({
                                    ...prev,
                                    translation: new Vector3(
                                        prev.translation.x,
                                        clamp({value: prev.translation.y + delta, min: translationMin, max: translationMax}),
                                        prev.translation.z
                                    ),
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onPropertiesChange(prev => ({
                                    ...prev,
                                    translation: new Vector3(
                                        prev.translation.x,
                                        clamp({value, min: translationMin, max: translationMax}),
                                        prev.translation.z
                                    ),
                                }));
                            }}
                            canIncrease
                            canDecrease
                            inputId={"ObjectTransformY"}
                        />
                    </div>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Z</p>
                        <MutableNumberField
                            value={objectProperties.translation.z}
                            minValue={translationMin}
                            maxValue={translationMax}
                            step={20}
                            onStep={(delta) => {
                                props.onPropertiesChange(prev => ({
                                    ...prev,
                                    translation: new Vector3(
                                        prev.translation.x,
                                        prev.translation.y,
                                        clamp({value: prev.translation.z + delta, min: translationMin, max: translationMax})
                                    ),
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onPropertiesChange(prev => ({
                                    ...prev,
                                    translation: new Vector3(
                                        prev.translation.x,
                                        prev.translation.y,
                                        clamp({value, min: translationMin, max: translationMax})
                                    ),
                                }));
                            }}
                            canIncrease
                            canDecrease
                            inputId={"ObjectTransformZ"}
                        />
                    </div>
                </div>

                <div className="ExpandableRowChildSection ObjectRotationProperties">
                    <p>Rotation</p>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">X</p>
                        <MutableNumberField
                            value={objectProperties.rotation.x}
                            minValue={rotationMin}
                            maxValue={rotationMax}
                            step={1}
                            onStep={(delta) => {
                                props.onPropertiesChange(prev => ({
                                    ...prev,
                                    rotation: new Vector3(
                                        mod(prev.rotation.x + delta, 360),
                                        prev.rotation.y,
                                        prev.rotation.z
                                    ),
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onPropertiesChange(prev => ({
                                    ...prev,
                                    rotation: new Vector3(
                                        mod(value, 360),
                                        prev.rotation.y,
                                        prev.rotation.z
                                    ),
                                }));
                            }}
                            canIncrease
                            canDecrease
                            inputId={"ObjectRotateX"}
                        />
                    </div>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Y</p>
                        <MutableNumberField
                            value={objectProperties.rotation.y}
                            minValue={rotationMin}
                            maxValue={rotationMax}
                            step={1}
                            onStep={(delta) => {
                                props.onPropertiesChange(prev => ({
                                    ...prev,
                                    rotation: new Vector3(
                                        prev.rotation.x,
                                        mod(prev.rotation.y + delta, 360),
                                        prev.rotation.z
                                    ),
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onPropertiesChange(prev => ({
                                    ...prev,
                                    rotation: new Vector3(
                                        prev.rotation.x,
                                        mod(value, 360),
                                        prev.rotation.z
                                    ),
                                }));
                            }}
                            canIncrease
                            canDecrease
                            inputId={"ObjectRotateY"}
                        />
                    </div>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Z</p>
                        <MutableNumberField
                            value={objectProperties.rotation.z}
                            minValue={rotationMin}
                            maxValue={rotationMax}
                            step={1}
                            onStep={(delta) => {
                                props.onPropertiesChange(prev => ({
                                    ...prev,
                                    rotation: new Vector3(
                                        prev.rotation.x,
                                        prev.rotation.y,
                                        mod(prev.rotation.z + delta, 360)
                                    ),
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onPropertiesChange(prev => ({
                                    ...prev,
                                    rotation: new Vector3(
                                        prev.rotation.x,
                                        prev.rotation.y,
                                        mod(value, 360)
                                    ),
                                }));
                            }}
                            canIncrease
                            canDecrease
                            inputId={"ObjectRotateZ"}
                        />
                    </div>
                </div>

            </div>
        </ExpandableRow>
    );
}