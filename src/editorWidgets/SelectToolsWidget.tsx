import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { ExpandableRow } from "./ExpandableRow";

export type SelectToolsWidgetProps = {
    buttonPanel: React.ReactNode;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectToolsVersion: number;
}

export function SelectToolsWidget(props: SelectToolsWidgetProps){
    const TriggerIcon = props.isOpen? ChevronDownIcon : ChevronRightIcon;

    return <ExpandableRow
        trigger = {<button type="button" className="ExpandableRowTriggerButton">
        <TriggerIcon className="ExpandableRowTriggerButtonIcon" />
        <p className="ExpandableRowTriggerButtonText">Select Tools</p>
      </button>}
        children={props.buttonPanel}
        isOpen={props.isOpen}
        onOpenChange={props.onOpenChange}
    />
}