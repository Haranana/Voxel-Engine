import "../editorWidgets/ExpandableRow.css"

export type ExpandableRowProps = {
    trigger: React.ReactNode;
    children: React.ReactNode;
    isOpen: boolean;
    onOpenChange?: (open: boolean) => void;
    className? : string;
}

export function ExpandableRow(props: ExpandableRowProps){
    return <div className={`ExpandableRow ${props.className? props.className : ""}`}>
        <div className="ExpandableRowTrigger" onPointerDown={(_)=>{props.onOpenChange? props.onOpenChange(!props.isOpen) : null}}>
            {props.trigger}
        </div>
        {props.isOpen?
        <div className="ExpandableRowChildrenWrapper">
            {props.children}
        </div> 
        : null}
    </div>
}