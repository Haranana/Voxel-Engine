import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { ExpandableRow } from "../ExpandableRow";
import { Tooltip } from "../../other_components/tooltip/Tooltip";
import { useContext, useEffect } from "react";
import { ControllerContext } from "../../editor_controller/ControllerContext";
import MdiPencilPlusOutline from "../../icons/MdiPencilPlusOutline";
import SolarEraserOutline from "../../icons/SolarEraserOutline";
import MdiBrushVariant from "../../icons/MdiBrushVariant";
import MaterialSymbolsLightMoveSelectionRightOutlineRounded from "../../icons/MaterialSymbolsLightMoveSelectionRightOutlineRounded";
import MdiVectorRectangle from "../../icons/MdiVectorRectangle";
import './EditTools.css'
import { selectToEditCompatibility, type EditMode, type SelectMode } from "../../editor_controller/EditorController";
import TablerColorPicker from "../../icons/TablerColorPicker";
import MdiAxisArrow from "../../icons/MdiAxisArrow";

export type EditToolsWidgetProps = {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onValueChange: ()=>void;
    
}

export function EditToolsWidget(props: EditToolsWidgetProps){
    const controller = useContext(ControllerContext)!;
    const TriggerIcon = props.isOpen? ChevronDownIcon : ChevronRightIcon;

    useEffect(()=>{
        controller.editModeChangedEvent.subscribe(props.onValueChange);
    },[])

    return <ExpandableRow
        className="EditToolsWidget"
        trigger = {<button type="button" className="ExpandableRowTriggerButton">
        <TriggerIcon className="ExpandableRowTriggerButtonIcon" />
        <p className="ExpandableRowTriggerButtonText">Edit Tools</p>
      </button>}
        isOpen={props.isOpen}
        onOpenChange={props.onOpenChange}
    >
        <div className="EditToolsButtonsWrapper">
        <div className="EditToolsButtons">
            <Tooltip text="Add" textClass="EditToolsTooltipText">
                <button className={`AddEditButton${controller.getEditMode()==="Add"? " CurrentEditModeButton" : ""}`} 
                onClick={() => {controller.setEditMode("Add"); props.onValueChange()}}
                disabled ={
                   !selectToEditCompatibility.get(controller.getSelectMode())!.has("Add")}
                >
                    <MdiPencilPlusOutline/>
                </button>    
            </Tooltip>

            <Tooltip text="Remove" textClass="EditToolsTooltipText">
                <button
                    className={`RemoveEditButton${controller.getEditMode()==="Remove"? " CurrentEditModeButton" : ""}`} 
                    onClick={() => { controller.setEditMode("Remove"); props.onValueChange() }}
                    disabled={!selectToEditCompatibility.get(controller.getSelectMode())!.has("Remove")}
                >
                    <SolarEraserOutline/>
                </button>    
            </Tooltip>

            <Tooltip text="Paint" textClass="EditToolsTooltipText">
                <button
                    className={`PaintEditButton${controller.getEditMode()==="Paint"? " CurrentEditModeButton" : ""}`} 
                    onClick={() => { controller.setEditMode("Paint"); props.onValueChange() }}
                    disabled={!selectToEditCompatibility.get(controller.getSelectMode())!.has("Paint")}
                >
                    <MdiBrushVariant/>
                </button>                
            </Tooltip>

            <Tooltip text="Move" textClass="EditToolsTooltipText">
                <button
                    className={`MoveEditButton${controller.getEditMode()==="Move"? " CurrentEditModeButton" : ""}`} 
                    onClick={() => { controller.setEditMode("Move"); props.onValueChange() }}
                    disabled={!selectToEditCompatibility.get(controller.getSelectMode())!.has("Move")}
                >
                    <MdiAxisArrow/>
                </button>
            </Tooltip>

            <Tooltip text="Select" textClass="EditToolsTooltipText">
                <button
                    className={`SelectEditButton${controller.getEditMode()==="Select"? " CurrentEditModeButton" : ""}`} 
                    onClick={() => { controller.setEditMode("Select"); props.onValueChange() }}
                    disabled={!selectToEditCompatibility.get(controller.getSelectMode())!.has("Select")}
                >
                    <MdiVectorRectangle/>
                </button>
            </Tooltip>

            <Tooltip text="Pick Color" textClass="EditToolsTooltipText">
                <button
                    className={`SelectEditButton${controller.getEditMode()==="PickColor"? " CurrentEditModeButton" : ""}`} 
                    onClick={() => { controller.setEditMode("PickColor"); 
                        props.onValueChange() }}
                    disabled={!selectToEditCompatibility.get(controller.getSelectMode())!.has("PickColor")}
                >
                    <TablerColorPicker/>
                </button>
            </Tooltip>            
        </div>
        </div>
    
    </ExpandableRow>
}