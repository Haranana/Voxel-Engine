import { useContext, useState} from "react";
import { ExpandableRow } from "../ExpandableRow";
import { MutableNumberField } from "../MutableNumberField";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import './CameraProperties.css'
import { ControllerContext } from "../../editor_controller/ControllerContext";
import type { ProjectionType } from "../../../voxel_engine/scene-objects/camera/camera";
import MdiLockOutline from "../../icons/MdiLockOutline";
import MdiLockOpenVariantOutline from "../../icons/MdiLockOpenVariantOutline";

export type CameraPropertiesProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onValueChange: ()=>void;
};

type Axis = "x"|"y"|"z";

export default function CameraPropertiesWidget(props: CameraPropertiesProps) {
    const controller = useContext(ControllerContext)!;
    const [isTargetXLocked, setTargetXLocked] = useState<boolean>(true); 
    const [isTargetYLocked, setTargetYLocked] = useState<boolean>(true); 
    const [isTargetZLocked, setTargetZLocked] = useState<boolean>(true); 

    const TriggerIcon = props.isOpen ? ChevronDownIcon : ChevronRightIcon;

    function addTargetToGrouped(delta: number, axis: Axis){
        let modifyX: boolean = false;
        let modifyY: boolean = false;
        let modifyZ: boolean = false;  
        if(axis=="x"){
            modifyX = true;
            if(isTargetXLocked){
                if(isTargetYLocked){
                    modifyY = true;
                }
                if(isTargetZLocked){
                    modifyZ = true;
                }
            }
        }else if(axis=="y"){
            modifyY = true;
            if(isTargetYLocked){
                if(isTargetXLocked){
                    modifyX = true;
                }
                if(isTargetZLocked){
                    modifyZ = true;
                }
            }
        }else if(axis=="z"){
            modifyZ = true;
            if(isTargetZLocked){
                if(isTargetXLocked){
                    modifyX = true;
                }
                if(isTargetYLocked){
                    modifyY = true;
                }
            }
        }
        if(modifyX) controller.addCameraTargetX(delta);
        if(modifyY) controller.addCameraTargetY(delta);
        if(modifyZ) controller.addCameraTargetZ(delta);
    }

    function setTargetToGrouped(value: number, axis: Axis){
        let modifyX: boolean = false;
        let modifyY: boolean = false;
        let modifyZ: boolean = false;  
        if(axis=="x"){
            modifyX = true;
            if(isTargetXLocked){
                if(isTargetYLocked){
                    modifyY = true;
                }
                if(isTargetZLocked){
                    modifyZ = true;
                }
            }
        }else if(axis=="y"){
            modifyY = true;
            if(isTargetYLocked){
                if(isTargetXLocked){
                    modifyX = true;
                }
                if(isTargetZLocked){
                    modifyZ = true;
                }
            }
        }else if(axis=="z"){
            modifyZ = true;
            if(isTargetZLocked){
                if(isTargetXLocked){
                    modifyX = true;
                }
                if(isTargetYLocked){
                    modifyY = true;
                }
            }
        }
        if(modifyX) controller.setCameraTargetX(value);
        if(modifyY) controller.setCameraTargetY(value);
        if(modifyZ) controller.setCameraTargetZ(value);
    }

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
            <div className="CameraPropertiesWidget">
                
                <div className="CameraProjectionProperties">
                    <p className="WidgetButtonsPanelTitle">Projection</p>
                    <div className="MutableFieldWrapper ProjectionFieldWrapper">
                        <p className="MutableFieldTitle">Type</p>
                        <select
                            className="Input"
                            value={controller.getCameraProjectionType() ?? "No active camera"}
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
                    <div className="MutableFieldWrapper">
                        <p className="MutableFieldTitle">Fov Y</p>
                        <MutableNumberField
                            value={controller.getCameraFovY() ?? 0}
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
                    <div className="MutableFieldWrapper">
                        <p className="MutableFieldTitle">Near</p>
                        <MutableNumberField
                            value={controller.getCameraNear() ?? 0}
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
                    <div className="MutableFieldWrapper">
                        <p className="MutableFieldTitle">Far</p>
                        <MutableNumberField
                            value={controller.getCameraFar() ?? 0}
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
                            intervalLength={1}
                        />
                    </div>                
                </div>



                <div className="CameraOrbitProperties">
                    <p>Orbit</p>

                    <div className="MutableFieldWrapper">
                        <p className="MutableFieldTitle">Span</p>
                        <MutableNumberField
                            value={controller.getCameraDistance() ?? 0}
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

                    <div className="MutableFieldWrapper">
                        <p className="MutableFieldTitle">Pitch</p>
                        <MutableNumberField
                            value={controller.getCameraPitch() ?? 0}
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

                    <div className="MutableFieldWrapper">
                        <p className="MutableFieldTitle">Yaw</p>
                        <MutableNumberField
                            value={controller.getCameraYaw() ?? 0}
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
                    
                    <div className="WidgetButtonsPanelWrapper">
                        <div className="WidgetButtonsPanel">
                            <button onClick={()=>{controller.centerCameraAtPositiveX(); props.onValueChange()}}>+X</button>
                            <button onClick={()=>{controller.centerCameraAtPositiveY(); props.onValueChange()}}>+Y</button>
                            <button onClick={()=>{controller.centerCameraAtPositiveZ(); props.onValueChange()}}>+Z</button>
                            <button onClick={()=>{controller.centerCameraAtNegativeX(); props.onValueChange()}}>-X</button>
                            <button onClick={()=>{controller.centerCameraAtNegativeY(); props.onValueChange()}}>-Y</button>
                            <button onClick={()=>{controller.centerCameraAtNegativeZ(); props.onValueChange()}}>-Z</button>
                        </div>
                    </div>
                    
                </div>
                <div className="CameraTargetProperties">
                    <p>Target</p>

                    <div className="MutableFieldWrapper">
                        <p className="MutableFieldTitle">X</p>
                        <MutableNumberField
                            value={controller.getCameraTarget()?.x ?? 0}
                            step={20}
                            onStep={(delta) => addTargetToGrouped(delta, "x")}
                            onAcceptedChange={(value) =>setTargetToGrouped(value, "x")}
                            canIncrease
                            canDecrease
                            inputId={"CameraTargetXValue"}
                        />
                    <button className="targetLockButton" onClick={()=>setTargetXLocked(prev=>!prev)}>
                        {isTargetXLocked? <MdiLockOutline/> : <MdiLockOpenVariantOutline/>}
                    </button>                        
                    </div>

                    <div className="MutableFieldWrapper">
                        <p className="MutableFieldTitle">Y</p>
                        <MutableNumberField
                            value={controller.getCameraTarget()?.y ?? 0}
                            step={20}
                            onStep={(delta) => addTargetToGrouped(delta, "y")}
                            onAcceptedChange={(value) =>setTargetToGrouped(value, "y")}
                            canIncrease
                            canDecrease
                            inputId={"CameraTargetYValue"}
                        />
                    <button className="targetLockButton" onClick={()=>setTargetYLocked(prev=>!prev)}>
                        {isTargetYLocked? <MdiLockOutline/> : <MdiLockOpenVariantOutline/>}
                    </button>                        
                    </div>

                    <div className="MutableFieldWrapper">
                        <p className="MutableFieldTitle">Z</p>
                        <MutableNumberField
                            value={controller.getCameraTarget()?.z ?? 0}
                            step={20}
                            onStep={(delta) => addTargetToGrouped(delta, "z")}
                            onAcceptedChange={(value) =>setTargetToGrouped(value, "z")}
                            canIncrease
                            canDecrease
                            inputId={"CameraTargetZValue"}
                        />
                    <button className="targetLockButton" onClick={()=>setTargetZLocked(prev=>!prev)}>
                        {isTargetZLocked? <MdiLockOutline/> : <MdiLockOpenVariantOutline/>}
                    </button>  


                    </div>
                </div>
                <div className="WidgetButtonsPanelWrapper">
                    <div className="WidgetButtonsPanel DefaultCameraButtonsPanel">
                        <button onClick={()=>{controller.loadCameraDefaultParameters(); props.onValueChange()}}>Load Default</button>
                    </div>     
                </div>                
            </div>
        </ExpandableRow>
    );
}