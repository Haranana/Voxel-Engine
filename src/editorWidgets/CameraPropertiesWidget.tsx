import { useContext } from "react";
import { ExpandableRow } from "./ExpandableRow";
import { MutableNumberField } from "./MutableNumberField";
import type { Camera, ProjectionType } from "../classes/camera";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import "../editorWidgets/ExpandableRow.css";
import { ControllerContext } from "../ControllerContext";

export type CameraPropertiesProps = {
    camera: Camera;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    cameraVersion: number;
};

export default function CameraPropertiesWidget(props: CameraPropertiesProps) {
    const camera = props.camera;
    const controller = useContext(ControllerContext)!;

    const TriggerIcon = props.isOpen ? ChevronDownIcon : ChevronRightIcon;

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
                            onChange={(e) =>
                                controller.setCameraProjectionType(
                                    e.target.value as ProjectionType
                                )
                            }
                        >
                            <option value="perspective">perspective</option>
                            <option value="orthographic">orthographic</option>
                        </select>
                    </div>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Fov Y</p>
                        <MutableNumberField
                            value={camera.fovY}
                            minValue={controller.cameraFovYMinValue}
                            maxValue={controller.cameraFovYMaxValue}
                            step={1}
                            onStep={(delta) => controller.addCameraFovY(delta)}
                            onAcceptedChange={(value) =>
                                controller.setCameraFovY(value)
                            }
                            canIncrease
                            canDecrease
                            inputId={"CameraFovYValue"}
                        />
                    </div>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Near</p>
                        <MutableNumberField
                            value={camera.near}
                            minValue={controller.cameraNearMinValue}
                            maxValue={controller.cameraNearMaxValue}
                            step={1}
                            onStep={(delta) => controller.addCameraNear(delta)}
                            onAcceptedChange={(value) =>
                                controller.setCameraNear(value)
                            }
                            canIncrease
                            canDecrease
                            inputId={"CameraNearValue"}
                        />
                    </div>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Far</p>
                        <MutableNumberField
                            value={camera.far}
                            minValue={controller.cameraFarMinValue}
                            maxValue={controller.cameraFarMaxValue}
                            step={1}
                            onStep={(delta) => controller.addCameraFar(delta)}
                            onAcceptedChange={(value) =>
                                controller.setCameraFar(value)
                            }
                            canIncrease
                            canDecrease
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
                            minValue={controller.cameraDistanceMinValue}
                            maxValue={controller.cameraDistanceMaxValue}
                            step={20}
                            onStep={(delta) => controller.addCameraDistance(delta)}
                            onAcceptedChange={(value) =>
                                controller.setCameraDistance(value)
                            }
                            canIncrease
                            canDecrease
                            inputId={"CameraDistanceValue"}
                        />
                    </div>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Pitch</p>
                        <MutableNumberField
                            value={camera.pitch}
                            minValue={controller.cameraPitchMinValue}
                            maxValue={controller.cameraPitchMaxValue}
                            step={1}
                            onStep={(delta) => controller.addCameraPitch(delta)}
                            onAcceptedChange={(value) =>
                                controller.setCameraPitch(value)
                            }
                            canIncrease
                            canDecrease
                            inputId={"CameraPitchValue"}
                        />
                    </div>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Yaw</p>
                        <MutableNumberField
                            value={camera.yaw}
                            minValue={controller.cameraYawMinValue}
                            maxValue={controller.cameraYawMaxValue}
                            step={1}
                            onStep={(delta) => controller.addCameraYaw(delta)}
                            onAcceptedChange={(value) =>
                                controller.setCameraYaw(value)
                            }
                            canIncrease
                            canDecrease
                            inputId={"CameraYawValue"}
                        />
                    </div>
                </div>

                <div className="CameraTargetProperties ExpendableRowChildSection">
                    <p>Target</p>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">X</p>
                        <MutableNumberField
                            value={camera.target.x}
                            step={20}
                            onStep={(delta) => controller.addCameraTargetX(delta)}
                            onAcceptedChange={(value) =>
                                controller.setCameraTargetX(value)
                            }
                            canIncrease
                            canDecrease
                            inputId={"CameraTargetXValue"}
                        />
                    </div>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Y</p>
                        <MutableNumberField
                            value={camera.target.y}
                            step={20}
                            onStep={(delta) => controller.addCameraTargetY(delta)}
                            onAcceptedChange={(value) =>
                                controller.setCameraTargetY(value)
                            }
                            canIncrease
                            canDecrease
                            inputId={"CameraTargetYValue"}
                        />
                    </div>

                    <div className="PropertiesRow">
                        <p className="MutableFieldTitle">Z</p>
                        <MutableNumberField
                            value={camera.target.z}
                            step={20}
                            onStep={(delta) => controller.addCameraTargetZ(delta)}
                            onAcceptedChange={(value) =>
                                controller.setCameraTargetZ(value)
                            }
                            canIncrease
                            canDecrease
                            inputId={"CameraTargetZValue"}
                        />
                    </div>
                </div>
            </div>
        </ExpandableRow>
    );
}