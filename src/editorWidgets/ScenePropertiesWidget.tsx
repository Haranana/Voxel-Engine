import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { ExpandableRow } from "./ExpandableRow";

export type ScenePropertiesWidgetProps = {
    buttonPanel: React.ReactNode;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    version: number;
}

export default function ScenePropertiesWidget(props: ScenePropertiesWidgetProps){
    const TriggerIcon = props.isOpen? ChevronDownIcon : ChevronRightIcon;

    return <ExpandableRow
        trigger = {<button type="button" className="ExpandableRowTriggerButton">
        <TriggerIcon className="ExpandableRowTriggerButtonIcon" />
        <p className="ExpandableRowTriggerButtonText">Scene Properties</p>
      </button>}
        children={props.buttonPanel}
        isOpen={props.isOpen}
        onOpenChange={props.onOpenChange}
    />
}