import React from "react";
import { ExpandableRow } from "./ExpandableRow";
import { MutableNumberField } from "./MutableNumberField";
import type { Camera, ProjectionType } from "../classes/camera";
import { Vector3 } from "../math/vector3.type";
import { clamp, mod } from "../math/utils";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import "../editorWidgets/ExpandableRow.css";

export type CameraPropertiesProps = {
    camera: Camera;
    onCameraChange: React.Dispatch<React.SetStateAction<Camera>>;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function CameraPropertiesWidget(props: CameraPropertiesProps) {
    const camera = props.camera;

    const TriggerIcon = props.isOpen ? ChevronDownIcon : ChevronRightIcon;

    const fovYMinValue = 1;
    const fovYMaxValue = 179;

    const nearMinValue = 0.001;
    const nearMaxValue = 1000;

    const farMinValue = 0.001;
    const farMaxValue = 5000;

    const distanceMinValue = 0;
    const distanceMaxValue = 10000;

    const pitchMinValue = -89;
    const pitchMaxValue = 89;
    const yawMinValue = 0;
    const yawMaxValue = 360;

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
            trigger={
                <button type="button" className="ExpandableRowTriggerButton">
                    <TriggerIcon className="ExpandableRowTriggerButtonIcon" />
                    <p className="ExpandableRowTriggerButtonText">Camera properties</p>
                </button>
            }
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

                <div className="CameraOrbitProperties ExpendableRowChildSection">
                    <p>Orbit</p>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Distance</p>
                        <MutableNumberField
                            value={camera.distance}
                            minValue={distanceMinValue}
                            maxValue={distanceMaxValue}
                            step={20}
                            onStep={(delta) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    distance: clamp({
                                        value: prev.distance + delta,
                                        min: distanceMinValue,
                                        max: distanceMaxValue,
                                    }),
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    distance: clamp({
                                        value,
                                        min: distanceMinValue,
                                        max: distanceMaxValue,
                                    }),
                                }));
                            }}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"CameraDistanceValue"}
                        />
                    </div>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Pitch</p>
                        <MutableNumberField
                            value={camera.pitch}
                            minValue={pitchMinValue}
                            maxValue={pitchMaxValue}
                            step={1}
                            onStep={(delta) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    pitch: clamp({value: prev.pitch + delta, min: pitchMinValue, max: pitchMaxValue }), 
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    pitch: value,
                                }));
                            }}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"CameraPitchValue"}
                        />
                    </div>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Yaw</p>
                        <MutableNumberField
                            value={camera.yaw}
                            minValue={yawMinValue}
                            maxValue={yawMaxValue}
                            step={1}
                            onStep={(delta) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    yaw: mod(prev.yaw + delta, 360),
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    yaw: mod(value, 360),
                                }));
                            }}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"CameraYawValue"}
                        />
                    </div>
                </div>

                <div className="CameraTargetProperties ExpendableRowChildSection">
                    <p>Target</p>

                    <div className="PropertiesRow TransformPropertiesXRow">
                        <p className="MutableFieldTitle">X</p>
                        <MutableNumberField
                            value={camera.target.x}
                            step={20}
                            onStep={(delta) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    target: new Vector3(
                                        prev.target.x + delta,
                                        prev.target.y,
                                        prev.target.z
                                    ),
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    target: new Vector3(
                                        value,
                                        prev.target.y,
                                        prev.target.z
                                    ),
                                }));
                            }}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"CameraTargetXValue"}
                        />
                    </div>

                    <div className="PropertiesRow TransformPropertiesYRow">
                        <p className="MutableFieldTitle">Y</p>
                        <MutableNumberField
                            value={camera.target.y}
                            step={20}
                            onStep={(delta) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    target: new Vector3(
                                        prev.target.x,
                                        prev.target.y + delta,
                                        prev.target.z
                                    ),
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    target: new Vector3(
                                        prev.target.x,
                                        value,
                                        prev.target.z
                                    ),
                                }));
                            }}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"CameraTargetYValue"}
                        />
                    </div>

                    <div className="PropertiesRow TransformPropertiesZRow">
                        <p className="MutableFieldTitle">Z</p>
                        <MutableNumberField
                            value={camera.target.z}
                            step={20}
                            onStep={(delta) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    target: new Vector3(
                                        prev.target.x,
                                        prev.target.y,
                                        prev.target.z + delta
                                    ),
                                }));
                            }}
                            onAcceptedChange={(value) => {
                                props.onCameraChange((prev) => ({
                                    ...prev,
                                    target: new Vector3(
                                        prev.target.x,
                                        prev.target.y,
                                        value
                                    ),
                                }));
                            }}
                            canIncrease={true}
                            canDecrease={true}
                            inputId={"CameraTargetZValue"}
                        />
                    </div>
                </div>
            </div>
        </ExpandableRow>
    );
}