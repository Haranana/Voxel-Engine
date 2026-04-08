import React from "react";
import { ExpandableRow } from "./ExpandableRow";
import { MutableNumberField } from "./MutableNumberField";
import { Vector3 } from "../math/vector3.type";
import { clamp, mod } from "../math/utils";
import type { ObjectProperties } from "../RenderableObjectTypes";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import "../editorWidgets/ExpandableRow.css"
import "../Editor.css"

export type ObjectPropertiesWidgetProps = {
    objectProperties: ObjectProperties;
    onPropertiesChange: React.Dispatch<React.SetStateAction<ObjectProperties>>;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function ObjectPropertiesWidget(props: ObjectPropertiesWidgetProps) {
    const objectProperties = props.objectProperties;
    const TriggerIcon = props.isOpen? ChevronDownIcon : ChevronRightIcon;

    const translationXMinValue = -10000;
    const translationXMaxValue = 10000;
    const translationYMinValue = -10000;
    const translationYMaxValue = 10000;
    const translationZMinValue = -10000;
    const translationZMaxValue = 10000;

    const rotationXMinValue = -10000;
    const rotationXMaxValue = 10000;
    const rotationYMinValue = -10000;
    const rotationYMaxValue = 10000;
    const rotationZMinValue = -10000;
    const rotationZMaxValue = 10000;

    return (
        <ExpandableRow
        trigger = {<button type="button" className="ExpandableRowTriggerButton">
        <TriggerIcon className="ExpandableRowTriggerButtonIcon" />
        <p className="ExpandableRowTriggerButtonText">Object properties</p>
      </button>}
            isOpen={props.isOpen}
            onOpenChange={props.onOpenChange}
        >
            <div className="ExpandableRowChild ObjectProperties">
                <div className="ExpandableRowChildSection ObjectTransformProperties">
                    <p>Position</p>

                    <div className="PropertiesRow TransformPropertiesXRow">
                        <p className="MutableFieldTitle">X</p>
                        <MutableNumberField
                            value={objectProperties.translation.x}
                            minValue={translationXMinValue}
                            maxValue={translationXMaxValue}
                            step={20}
                            onStep={(delta) => {
                                props.onPropertiesChange((prev) => ({
                                    ...prev,
                                    translation: new Vector3(
                                        clamp({value: prev.translation.x + delta, min: translationXMinValue, max: translationXMaxValue}),
                                        prev.translation.y,
                                        prev.translation.z
                                    ),
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onPropertiesChange((prev) => ({
                                    ...prev,
                                    translation: new Vector3(
                                        clamp({value,min: translationXMinValue,max: translationXMaxValue}),
                                        prev.translation.y,
                                        prev.translation.z
                                    ),
                                }));
                            }}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"ObjectTransformXValue"}
                        />
                    </div>

                    <div className="PropertiesRow TransformPropertiesYRow">
                        <p className="MutableFieldTitle">Y</p>
                        <MutableNumberField
                            value={objectProperties.translation.y}
                            minValue={translationYMinValue}
                            maxValue={translationYMaxValue}
                            step={20}
                            onStep={(delta) => {
                                props.onPropertiesChange((prev) => ({
                                    ...prev,
                                    translation: new Vector3(
                                        prev.translation.x,
                                        clamp({value: prev.translation.y + delta, min: translationYMinValue, max: translationYMaxValue}),
                                        prev.translation.z
                                    ),
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onPropertiesChange((prev) => ({
                                    ...prev,
                                    translation: new Vector3(
                                        prev.translation.x,
                                        clamp({value,min: translationYMinValue,max: translationYMaxValue}),
                                        prev.translation.z
                                    ),
                                }));
                            }}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"ObjectTransformYValue"}
                        />
                    </div>

                    <div className="PropertiesRow TransformPropertiesZRow">
                        <p className="MutableFieldTitle">Z</p>
                        <MutableNumberField
                            value={objectProperties.translation.z}
                            minValue={translationZMinValue}
                            maxValue={translationZMaxValue}
                            step={20}
                            onStep={(delta) => {
                                props.onPropertiesChange((prev) => ({
                                    ...prev,
                                    translation: new Vector3(
                                        prev.translation.x,
                                        prev.translation.y,
                                        clamp({value: prev.translation.z + delta, min: translationZMinValue, max: translationZMaxValue})
                                    ),
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onPropertiesChange((prev) => ({
                                    ...prev,
                                    translation: new Vector3(
                                        prev.translation.x,
                                        prev.translation.y,
                                        clamp({value, min: translationZMinValue,max: translationZMaxValue})
                                    ),
                                }));
                            }}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"ObjectTransformZValue"}
                        />
                    </div>
                </div>

                <div className="ExpandableRowChildSection ObjectRotationProperties">
                    <p>Rotation</p>

                    <div className="PropertiesRow TransformPropertiesXRow">
                        <p className="MutableFieldTitle">X</p>
                        <MutableNumberField
                            value={objectProperties.rotation.x}
                            minValue={rotationXMinValue}
                            maxValue={rotationXMaxValue}
                            step={1}
                            onStep={(delta) => {
                                props.onPropertiesChange((prev) => ({
                                    ...prev,
                                    rotation: new Vector3(
                                        mod(prev.rotation.x + delta, 360),
                                        prev.rotation.y,
                                        prev.rotation.z
                                    ),
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onPropertiesChange((prev) => ({
                                    ...prev,
                                    rotation: new Vector3(
                                        mod(value, 360),
                                        prev.rotation.y,
                                        prev.rotation.z
                                    ),
                                }));
                            }}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"ObjectRotateXValue"}
                        />
                    </div>

                    <div className="PropertiesRow TransformPropertiesYRow">
                        <p className="MutableFieldTitle">Y</p>
                        <MutableNumberField
                            value={objectProperties.rotation.y}
                            minValue={rotationYMinValue}
                            maxValue={rotationYMaxValue}
                            step={1}
                            onStep={(delta) => {
                                props.onPropertiesChange((prev) => ({
                                    ...prev,
                                    rotation: new Vector3(
                                        prev.rotation.x,
                                        mod(prev.rotation.y + delta, 360),
                                        prev.rotation.z
                                    ),
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onPropertiesChange((prev) => ({
                                    ...prev,
                                    rotation: new Vector3(
                                        prev.rotation.x,
                                        mod(value, 360),
                                        prev.rotation.z
                                    ),
                                }));
                            }}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"ObjectRotateYValue"}
                        />
                    </div>

                    <div className="PropertiesRow TransformPropertiesZRow">
                        <p className="MutableFieldTitle">Z</p>
                        <MutableNumberField
                            value={objectProperties.rotation.z}
                            minValue={rotationZMinValue}
                            maxValue={rotationZMaxValue}
                            step={1}
                            onStep={(delta) => {
                                props.onPropertiesChange((prev) => ({
                                    ...prev,
                                    rotation: new Vector3(
                                        prev.rotation.x,
                                        prev.rotation.y,
                                        mod(prev.rotation.z + delta, 360)
                                    ),
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onPropertiesChange((prev) => ({
                                    ...prev,
                                    rotation: new Vector3(
                                        prev.rotation.x,
                                        prev.rotation.y,
                                        mod(value, 360)
                                    ),
                                }));
                            }}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"ObjectRotateZValue"}
                        />
                    </div>
                </div>
            </div>
        </ExpandableRow>
    );
}