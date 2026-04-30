import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { ExpandableRow } from "./ExpandableRow";
export type EditToolsWidgetProps = {
    buttonPanel: React.ReactNode;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    editToolVersion: number;
}

export function EditToolsWidget(props: EditToolsWidgetProps){
    const TriggerIcon = props.isOpen? ChevronDownIcon : ChevronRightIcon;

    return <ExpandableRow
        trigger = {<button type="button" className="ExpandableRowTriggerButton">
        <TriggerIcon className="ExpandableRowTriggerButtonIcon" />
        <p className="ExpandableRowTriggerButtonText">Edit Tools</p>
      </button>}
        children={props.buttonPanel}
        isOpen={props.isOpen}
        onOpenChange={props.onOpenChange}
    />
}