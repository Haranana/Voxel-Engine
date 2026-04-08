import React from "react";
import { ExpandableRow } from "./ExpandableRow";
import { MutableNumberField } from "./MutableNumberField";
import type { Camera, ProjectionType } from "../classes/camera";
import { Vector3 } from "../math/vector3.type";
import { clamp, mod } from "../math/utils";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import "../editorWidgets/ExpandableRow.css"

export type CameraPropertiesProps = {
    camera: Camera;
    onCameraChange: React.Dispatch<React.SetStateAction<Camera>>;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function CameraPropertiesWidget(props: CameraPropertiesProps) {
    const camera = props.camera;

    const TriggerIcon = props.isOpen? ChevronDownIcon : ChevronRightIcon;

    const fovYMinValue = 1;
    const fovYMaxValue = 179;

    const nearMinValue = 0.001;
    const nearMaxValue = 1000;

    const farMinValue = 0.001;
    const farMaxValue = 5000;

    const translationXMinValue = -10000;
    const translationXMaxValue = 10000;
    const translationYMinValue = -10000;
    const translationYMaxValue = 10000;
    const translationZMinValue = -10000;
    const translationZMaxValue = 10000;

    const rotationXMinValue = 0;
    const rotationXMaxValue = 360;
    const rotationYMinValue = 0;
    const rotationYMaxValue = 360;
    const rotationZMinValue = 0;
    const rotationZMaxValue = 360;

    const onProjectionTypeChange = (newVal: ProjectionType) => {
        props.onCameraChange((prev) => ({
            ...prev,
            projectionType: newVal,
        }));
    };

    const onFovYAcceptedChange = (newVal: number) => {
        props.onCameraChange((prev) => ({
            ...prev,
            fovY: clamp({ value: newVal, min: fovYMinValue, max: fovYMaxValue }),
        }));
    };

    const onNearAcceptedChange = (newVal: number) => {
        props.onCameraChange((prev) => {
            const clampedNear = clamp({ value: newVal, min: nearMinValue, max: nearMaxValue });
            const fixedFar = clampedNear >= prev.far ? clampedNear + 0.001 : prev.far;

            return {
                ...prev,
                near: clampedNear,
                far: clamp({ value: fixedFar, min: farMinValue, max: farMaxValue }),
            };
        });
    };

    const onFarAcceptedChange = (newVal: number) => {
        props.onCameraChange((prev) => {
            const clampedFar = clamp({ value: newVal, min: farMinValue, max: farMaxValue });
            const fixedNear = clampedFar <= prev.near ? Math.max(nearMinValue, clampedFar - 0.001) : prev.near;

            return {
                ...prev,
                near: clamp({ value: fixedNear, min: nearMinValue, max: nearMaxValue }),
                far: clampedFar,
            };
        });
    };

    return (
        <ExpandableRow
        trigger = {<button type="button" className="ExpandableRowTriggerButton">
        <TriggerIcon className="ExpandableRowTriggerButtonIcon" />
        <p className="ExpandableRowTriggerButtonText">Camera properties</p>
      </button>}
            isOpen={props.isOpen}
            onOpenChange={props.onOpenChange}
        >
            <div className="CameraProperties ExpandableRowChild">
                <div className="CameraProjectionProperties ExpendableRowChildSection">
                    <p>Projection</p>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Type</p>
                        <select
                            className="Input"
                            value={camera.projectionType}
                            onChange={(e) => onProjectionTypeChange(e.target.value as ProjectionType)}
                        >
                            <option value="perspective">perspective</option>
                            <option value="orthographic">orthographic</option>
                        </select>
                    </div>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Fov Y</p>
                        <MutableNumberField
                            value={camera.fovY}
                            minValue={fovYMinValue}
                            maxValue={fovYMaxValue}
                            step={1}
                            onStep={(delta) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    fovY: clamp({
                                        value: prev.fovY + delta,
                                        min: fovYMinValue,
                                        max: fovYMaxValue,
                                    }),
                                }));
                            }}
                            onAcceptedChange={onFovYAcceptedChange}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"CameraFovYValue"}
                        />
                    </div>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Near</p>
                        <MutableNumberField
                            value={camera.near}
                            minValue={nearMinValue}
                            maxValue={nearMaxValue}
                            step={1}
                            onStep={(delta) => {
                                props.onCameraChange((prev) => {
                                    const clampedNear = clamp({
                                        value: prev.near + delta,
                                        min: nearMinValue,
                                        max: nearMaxValue,
                                    });
                                    const fixedFar = clampedNear >= prev.far ? clampedNear + 0.001 : prev.far;

                                    return {
                                        ...prev,
                                        near: clampedNear,
                                        far: clamp({
                                            value: fixedFar,
                                            min: farMinValue,
                                            max: farMaxValue,
                                        }),
                                    };
                                });
                            }}
                            onAcceptedChange={onNearAcceptedChange}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"CameraNearValue"}
                        />
                    </div>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Far</p>
                        <MutableNumberField
                            value={camera.far}
                            minValue={farMinValue}
                            maxValue={farMaxValue}
                            step={1}
                            onStep={(delta) => {
                                props.onCameraChange((prev) => {
                                    const clampedFar = clamp({
                                        value: prev.far + delta,
                                        min: farMinValue,
                                        max: farMaxValue,
                                    });
                                    const fixedNear =
                                        clampedFar <= prev.near
                                            ? Math.max(nearMinValue, clampedFar - 0.001)
                                            : prev.near;

                                    return {
                                        ...prev,
                                        near: clamp({
                                            value: fixedNear,
                                            min: nearMinValue,
                                            max: nearMaxValue,
                                        }),
                                        far: clampedFar,
                                    };
                                });
                            }}
                            onAcceptedChange={onFarAcceptedChange}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"CameraFarValue"}
                        />
                    </div>
                </div>

                <div className="CameraTransformProperties ExpendableRowChildSection">
                    <p>Position</p>

                    <div className="PropertiesRow TransformPropertiesXRow">
                        <p className="MutableFieldTitle">X</p>
                        <MutableNumberField
                            value={camera.transform.translation.x}
                            minValue={translationXMinValue}
                            maxValue={translationXMaxValue}
                            step={20}
                            onStep={(delta) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    transform: {
                                        ...prev.transform,
                                        translation: new Vector3(
                                            clamp({
                                                value: prev.transform.translation.x + delta,
                                                min: translationXMinValue,
                                                max: translationXMaxValue,
                                            }),
                                            prev.transform.translation.y,
                                            prev.transform.translation.z
                                        ),
                                    },
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    transform: {
                                        ...prev.transform,
                                        translation: new Vector3(
                                            clamp({
                                                value,
                                                min: translationXMinValue,
                                                max: translationXMaxValue,
                                            }),
                                            prev.transform.translation.y,
                                            prev.transform.translation.z
                                        ),
                                    },
                                }));
                            }}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"CameraTransformXValue"}
                        />
                    </div>

                    <div className="PropertiesRow TransformPropertiesYRow">
                        <p className="MutableFieldTitle">Y</p>
                        <MutableNumberField
                            value={camera.transform.translation.y}
                            minValue={translationYMinValue}
                            maxValue={translationYMaxValue}
                            step={20}
                            onStep={(delta) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    transform: {
                                        ...prev.transform,
                                        translation: new Vector3(
                                            prev.transform.translation.x,
                                            clamp({
                                                value: prev.transform.translation.y + delta,
                                                min: translationYMinValue,
                                                max: translationYMaxValue,
                                            }),
                                            prev.transform.translation.z
                                        ),
                                    },
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    transform: {
                                        ...prev.transform,
                                        translation: new Vector3(
                                            prev.transform.translation.x,
                                            clamp({
                                                value,
                                                min: translationYMinValue,
                                                max: translationYMaxValue,
                                            }),
                                            prev.transform.translation.z
                                        ),
                                    },
                                }));
                            }}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"CameraTransformYValue"}
                        />
                    </div>

                    <div className="PropertiesRow TransformPropertiesZRow">
                        <p className="MutableFieldTitle">Z</p>
                        <MutableNumberField
                            value={camera.transform.translation.z}
                            minValue={translationZMinValue}
                            maxValue={translationZMaxValue}
                            step={20}
                            onStep={(delta) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    transform: {
                                        ...prev.transform,
                                        translation: new Vector3(
                                            prev.transform.translation.x,
                                            prev.transform.translation.y,
                                            clamp({
                                                value: prev.transform.translation.z + delta,
                                                min: translationZMinValue,
                                                max: translationZMaxValue,
                                            })
                                        ),
                                    },
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    transform: {
                                        ...prev.transform,
                                        translation: new Vector3(
                                            prev.transform.translation.x,
                                            prev.transform.translation.y,
                                            clamp({
                                                value,
                                                min: translationZMinValue,
                                                max: translationZMaxValue,
                                            })
                                        ),
                                    },
                                }));
                            }}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"CameraTransformZValue"}
                        />
                    </div>
                </div>

                <div className="CameraRotationProperties ExpendableRowChildSection">
                    <p>Rotation</p>

                    <div className="PropertiesRow TransformPropertiesXRow">
                        <p className="MutableFieldTitle">X</p>
                        <MutableNumberField
                            value={camera.transform.rotation.x}
                            minValue={rotationXMinValue}
                            maxValue={rotationXMaxValue}
                            step={1}
                            onStep={(delta) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    transform: {
                                        ...prev.transform,
                                        rotation: new Vector3(
                                            mod(prev.transform.rotation.x + delta, 360),
                                            prev.transform.rotation.y,
                                            prev.transform.rotation.z
                                        ),
                                    },
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    transform: {
                                        ...prev.transform,
                                        rotation: new Vector3(
                                            mod(value, 360),
                                            prev.transform.rotation.y,
                                            prev.transform.rotation.z
                                        ),
                                    },
                                }));
                            }}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"CameraRotateXValue"}
                        />
                    </div>

                    <div className="PropertiesRow TransformPropertiesYRow">
                        <p className="MutableFieldTitle">Y</p>
                        <MutableNumberField
                            value={camera.transform.rotation.y}
                            minValue={rotationYMinValue}
                            maxValue={rotationYMaxValue}
                            step={1}
                            onStep={(delta) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    transform: {
                                        ...prev.transform,
                                        rotation: new Vector3(
                                            prev.transform.rotation.x,
                                            mod(prev.transform.rotation.y + delta, 360),
                                            prev.transform.rotation.z
                                        ),
                                    },
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    transform: {
                                        ...prev.transform,
                                        rotation: new Vector3(
                                            prev.transform.rotation.x,
                                            mod(value, 360),
                                            prev.transform.rotation.z
                                        ),
                                    },
                                }));
                            }}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"CameraRotateYValue"}
                        />
                    </div>

                    <div className="PropertiesRow TransformPropertiesZRow">
                        <p className="MutableFieldTitle">Z</p>
                        <MutableNumberField
                            value={camera.transform.rotation.z}
                            minValue={rotationZMinValue}
                            maxValue={rotationZMaxValue}
                            step={1}
                            onStep={(delta) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    transform: {
                                        ...prev.transform,
                                        rotation: new Vector3(
                                            prev.transform.rotation.x,
                                            prev.transform.rotation.y,
                                            mod(prev.transform.rotation.z + delta, 360)
                                        ),
                                    },
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    transform: {
                                        ...prev.transform,
                                        rotation: new Vector3(
                                            prev.transform.rotation.x,
                                            prev.transform.rotation.y,
                                            mod(value, 360)
                                        ),
                                    },
                                }));
                            }}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"CameraRotateZValue"}
                        />
                    </div>
                </div>
            </div>
        </ExpandableRow>
    );
}