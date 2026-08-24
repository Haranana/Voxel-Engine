import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { ExpandableRow } from "../ExpandableRow";
import { useContext, useEffect, useState } from "react";
import { ControllerContext } from "../../editor_controller/ControllerContext";
import './EditVoxelObject.css'
import { MutableNumberField } from "../MutableNumberField";
import { VoxelObject } from "../../../voxel_engine/scene-objects/voxel/voxel-object";
import MdiLockOutline from "../../icons/MdiLockOutline";
import MdiLockOpenVariantOutline from "../../icons/MdiLockOpenVariantOutline";
import { Vector3 } from "../../../math/vector3.type";

export type EditVoxelObjectWidgetProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onValueChange: ()=>void;
    version: number;
}

type Axis = "x"|"y"|"z";

export function EditVoxelObjectWidget(props: EditVoxelObjectWidgetProps){
    const controller = useContext(ControllerContext)!;
    const TriggerIcon = props.isOpen? ChevronDownIcon : ChevronRightIcon;
    const [isResizeXLocked, setResizeXLocked] = useState<boolean>(true); 
    const [isResizeYLocked, setResizeYLocked] = useState<boolean>(true); 
    const [isResizeZLocked, setResizeZLocked] = useState<boolean>(true); 

    useEffect(()=>{
        controller.subscribeActiveVoSizeChangedSceneEvent(props.onValueChange)
    },[])

    //if given slider is grouped with others it increases/sets all of them at once, otherwise only the selected one
    function addSizeToGrouped(delta: number, axis: Axis){
        let modifyX: boolean = false;
        let modifyY: boolean = false;
        let modifyZ: boolean = false;  
        if(axis=="x"){
            modifyX = true;
            if(isResizeXLocked){
                if(isResizeYLocked){
                    modifyY = true;
                }
                if(isResizeZLocked){
                    modifyZ = true;
                }
            }
        }else if(axis=="y"){
            modifyY = true;
            if(isResizeYLocked){
                if(isResizeXLocked){
                    modifyX = true;
                }
                if(isResizeZLocked){
                    modifyZ = true;
                }
            }
        }else if(axis=="z"){
            modifyZ = true;
            if(isResizeZLocked){
                if(isResizeXLocked){
                    modifyX = true;
                }
                if(isResizeYLocked){
                    modifyY = true;
                }
            }
        }
        if(modifyX) controller.addVoxelObjectSizeX(delta);
        if(modifyY) controller.addVoxelObjectSizeY(delta);
        if(modifyZ) controller.addVoxelObjectSizeZ(delta);
    }

    function setSizeToGrouped(value: number, axis: Axis){
        let modifyX: boolean = false;
        let modifyY: boolean = false;
        let modifyZ: boolean = false;  
        if(axis=="x"){
            modifyX = true;
            if(isResizeXLocked){
                if(isResizeYLocked){
                    modifyY = true;
                }
                if(isResizeZLocked){
                    modifyZ = true;
                }
            }
        }else if(axis=="y"){
            modifyY = true;
            if(isResizeYLocked){
                if(isResizeXLocked){
                    modifyX = true;
                }
                if(isResizeZLocked){
                    modifyZ = true;
                }
            }
        }else if(axis=="z"){
            modifyZ = true;
            if(isResizeZLocked){
                if(isResizeXLocked){
                    modifyX = true;
                }
                if(isResizeYLocked){
                    modifyY = true;
                }
            }
        }
        if(modifyX) controller.setVoxelObjectSizeX(value);
        if(modifyY) controller.setVoxelObjectSizeY(value);
        if(modifyZ) controller.setVoxelObjectSizeZ(value);
    }

return <ExpandableRow
        trigger = {<button type="button" className="ExpandableRowTriggerButton">
        <TriggerIcon className="ExpandableRowTriggerButtonIcon" />
        <p className="ExpandableRowTriggerButtonText">Edit Object</p>
                </button>}   
        isOpen={props.isOpen}
        onOpenChange={props.onOpenChange}>
            <div className="EditVoxelObjectWidget">
                <div className="WidgetButtonsPanelWrapper">
                    <p className="WidgetButtonsPanelTitle">Size</p>
                    <div className="WidgetButtonsPanel ModifySizeButtonsPanel">
                    <button onClick={()=>controller.doubleVoxelObjectSize()}>Double</button>
                    <button onClick={()=>controller.halfVoxelObjectSize()}>Half</button>
                    </div>
                </div>
                <div className="MutableFieldWrapper">
                    <p className="MutableFieldTitle">X</p>
                    <MutableNumberField
                        value={controller.getVoxelObjectSize()?.x ?? 0}
                        minValue={2}
                        maxValue={VoxelObject.maxSize.x}
                        step={1}
                        onStep={(delta) => addSizeToGrouped(delta, "x")}
                        onAcceptedChange={(value) =>setSizeToGrouped(value, "x")}
                        canIncrease
                        canDecrease
                        inputId={"ObjectSizeXValue"}
                        intervalLength={200}
                    />
                    <button className="resizeLockButton" onClick={()=>setResizeXLocked(prev=>!prev)}>
                        {isResizeXLocked? <MdiLockOutline/> : <MdiLockOpenVariantOutline/>}
                    </button>                    
                </div>
                <div className="MutableFieldWrapper">
                    <p className="MutableFieldTitle">Y</p>
                    <MutableNumberField
                        value={controller.getVoxelObjectSize()?.y ?? 0}
                        minValue={2}
                        maxValue={VoxelObject.maxSize.y}
                        step={1}
                        onStep={(delta) => addSizeToGrouped(delta, "y")}
                        onAcceptedChange={(value) =>setSizeToGrouped(value, "y")}
                        canIncrease
                        canDecrease
                        inputId={"ObjectSizeYValue"}
                        intervalLength={200}
                    />
                    <button className="resizeLockButton" onClick={()=>setResizeYLocked(prev=>!prev)}>
                        {isResizeYLocked? <MdiLockOutline/> : <MdiLockOpenVariantOutline/>}
                    </button>
                </div>
                <div className="MutableFieldWrapper">
                    <p className="MutableFieldTitle">Z</p>
                    <MutableNumberField
                        value={controller.getVoxelObjectSize()?.z ?? 0}
                        minValue={2}
                        maxValue={VoxelObject.maxSize.z}
                        step={1}
                        onStep={(delta) => addSizeToGrouped(delta, "z")}
                        onAcceptedChange={(value) =>setSizeToGrouped(value, "z")}
                        canIncrease
                        canDecrease
                        inputId={"ObjectSizeZValue"}
                        intervalLength={200}
                    />
                    <button className="resizeLockButton" onClick={()=>setResizeZLocked(prev=>!prev)}>
                        {isResizeZLocked? <MdiLockOutline/> : <MdiLockOpenVariantOutline/>}
                    </button>       
                    
                                 
                </div>

                <div className="WidgetButtonsPanelWrapper">
                    <div className="WidgetButtonsPanel defaultSizesButtonsPanel">
                        <button onClick={()=>controller.setVoxelObjectSize(new Vector3(8,8,8))}>8</button>
                        <button onClick={()=>controller.setVoxelObjectSize(new Vector3(16,16,16))}>16</button>
                        <button onClick={()=>controller.setVoxelObjectSize(new Vector3(32,32,32))}>32</button>
                        <button onClick={()=>controller.setVoxelObjectSize(new Vector3(64,64,64))}>64</button>
                    </div>     
                </div>

                <div className="WidgetButtonsPanelWrapper">
                    <p className="WidgetButtonsPanelTitle">Voxels</p>
                    <div className="WidgetButtonsPanel">
                    <button onClick={()=>controller.fillVoxelObjectVoxels()}>Fill</button>
                    <button onClick={()=>controller.emptyVoxelObjectVoxels()}>Empty</button>
                    <button onClick={()=>controller.reverseVoxelObjectVoxels()}>Reverse</button>
                    </div>
                </div>
                <div className="WidgetButtonsPanelWrapper">
                    <p className="WidgetButtonsPanelTitle">Generate</p>
                    <div className="WidgetButtonsPanel">
                    <button onClick={()=>controller.regenerateVoxelObjectToSphere()}>Sphere</button>
                    <button onClick={()=>controller.regenerateVoxelObjectToPyramid()}>Pyramid</button>
                    <button onClick={()=>controller.regenerateVoxelObjectToCylinder()}>Cylinder</button>
                    </div>
                </div>
                <div className="WidgetButtonsPanelWrapper">
                    <p className="WidgetButtonsPanelTitle">Flip</p>
                    <div className="WidgetButtonsPanel WidgetVectorAxisButtonsPanel">
                    <button onClick={()=>controller.flipVoxelObjectByX()}>X</button>
                    <button onClick={()=>controller.flipVoxelObjectByY()}>Y</button>
                    <button onClick={()=>controller.flipVoxelObjectByZ()}>Z</button>
                    </div>
                </div>
                <div className="WidgetButtonsPanelWrapper">
                    <p className="WidgetButtonsPanelTitle">Rotate</p>
                    <div className="WidgetButtonsPanel WidgetVectorAxisButtonsPanel">
                    <button onClick={()=>controller.rotateVoxelObjectByX()}>X</button>
                    <button onClick={()=>controller.rotateVoxelObjectByY()}>Y</button>
                    <button onClick={()=>controller.rotateVoxelObjectByZ()}>Z</button>
                    </div>
                </div>                             
            </div>
        </ExpandableRow>
}