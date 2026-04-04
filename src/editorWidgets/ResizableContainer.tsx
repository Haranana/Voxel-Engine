import { useEffect, useState } from "react";
import "../editorWidgets/ResizableContainer.css"

export type ResizableContainerProps = {
    child: React.ReactNode | null,
    
    defaultWidth: number,
    isWidthChangeable: boolean,
    minWidth: number | null,
    maxWidth: number | null,

    defaultHeight: number,
    isHeightChangeable: boolean,
    minHeight: number | null,
    maxHeight: number | null,

    hasLeftHandle: boolean,
    hasRightHandle: boolean,
    hasTopHandle: boolean,
    hasBottomHandle: boolean,
};

type ResizeDirection =
  | "right"
  | "left"
  | "top"
  | "bottom"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

type ResizeType = 
    | "horizontal"
    | "vertical"
    | "diagonal";

type ResizeSession = {
  direction: ResizeDirection;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
} | null;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getResizeType(direction: ResizeDirection) : ResizeType{
    if(direction === "right" || direction === "left") return "horizontal";
    if(direction === "top" || direction === "bottom") return "vertical";
    return "diagonal";
}

export default function ResizableContainer(props: ResizableContainerProps){

    const [resizeSession, setResizeSession] = useState<ResizeSession>(null);
    const [width, setWidth] = useState(props.defaultWidth);
    const [height, setHeight] = useState(props.defaultHeight);
    const handleSize = 8; 

    function setWidthSafely(nextWidth: number) {
        const clamped = clamp(nextWidth, props.minWidth!, props.maxWidth!);
        setWidth(clamped);
    }

    function setHeightSafely(nextHeight: number) {
        const clamped = clamp(nextHeight, props.minHeight!, props.maxHeight!);
        setHeight(clamped);
    }

    function handlePointerDown(e: React.PointerEvent<HTMLDivElement>, direction: ResizeDirection) {
        e.preventDefault();

        setResizeSession({
            startX: e.clientX,
            startY: e.clientY,
            startWidth: width,
            startHeight: height,
            direction,
        })
    }

    useEffect(() => {
        if (resizeSession==null) return;
        
        function handlePointerMove(e: PointerEvent) {
            if(!resizeSession) return;

            const direction = resizeSession.direction
            const resizeType = getResizeType(direction);
            console.log(`dir: ${direction} | type: ${resizeType}`);
            if(resizeType == "vertical"){
                const deltaY = e.clientY - resizeSession.startY;
                const nextHeight = resizeSession.startHeight + deltaY;
                setHeightSafely(nextHeight);
            }else if(resizeType=="horizontal"){
                const deltaX = e.clientX - resizeSession.startX;
                const nextWidth = resizeSession.startWidth + deltaX;
                setWidthSafely(nextWidth);
            }else{
                const deltaY = e.clientY - resizeSession!.startY;
                const nextHeight = resizeSession!.startHeight + deltaY;
                setHeightSafely(nextHeight);
                const deltaX = e.clientX - resizeSession!.startX;
                const nextWidth = resizeSession!.startWidth + deltaX;
                setWidthSafely(nextWidth);
            }
        }

        function handlePointerUp() {
            setResizeSession(null);
        }

        if(props.isWidthChangeable || props.isHeightChangeable){
            window.addEventListener("pointermove", handlePointerMove);
            window.addEventListener("pointerup", handlePointerUp);
        }
        
        return () => {
            if(props.isWidthChangeable || props.isHeightChangeable){
                window.removeEventListener("pointermove", handlePointerMove);
                window.removeEventListener("pointerup", handlePointerUp);
            }
        };
    }, [resizeSession, props.minWidth, props.maxWidth]);

    return <div className="ResizableContainer" style={{ width: `${width}px` , height: `${height}px`}}>
        <div className="ResizableContainerVert">

            <div className="ResizableContainerTop">
                {props.hasTopHandle && props.hasLeftHandle? 
                    <div className="ResizableContainerHandle ContainerCornerHandle ContainerTopLeftHandle" onPointerDown={e=>handlePointerDown(e,"top-left")}
                style={{height: `${handleSize}px`, width: `${handleSize}px`}}/> : ""}            

                {props.hasTopHandle? 
                <div className="ResizableContainerHandle ContainerVertHandle ContainerTopHandle" onPointerDown={(e)=>handlePointerDown(e,"top")}
                style={{height: `${handleSize}px`}}/> : ""}

                {props.hasTopHandle && props.hasRightHandle?
                <div className="ResizableContainerHandle ContainerCornerHandle ContainerTopRightHandle" onPointerDown={(e)=>handlePointerDown(e,"top-right")}
                style={{height: `${handleSize}px`, width: `${handleSize}px`}}/> : ""}
            </div>
            
            <div className="ResizableContainerHor">
     
                {props.hasLeftHandle? 
                <div className="ResizableContainerHandle ContainerHorHandle ContainerLeftHandle" onPointerDown={(e)=>handlePointerDown(e,"left")}
                style={{width: `${handleSize}px`}}/> : ""}

                <div className="ResizableContainerChildWrapper">
                    {props.child!=null? props.child : ""}
                </div>                

                {props.hasRightHandle? 
                <div className="ResizableContainerHandle ContainerHorHandle ContainerRightHandle" onPointerDown={(e)=>handlePointerDown(e,"right")}
                style={{width: `${handleSize}px`}}/> : ""}
            </div>

            <div className="ResizableContainerBottom">
                {props.hasBottomHandle && props.hasLeftHandle? 
                    <div className="ResizableContainerHandle ContainerCornerHandle ContainerBottomLeftHandle" onPointerDown={e=>handlePointerDown(e,"bottom-left")}
                style={{height: `${handleSize}px`, width: `${handleSize}px`}}/> : ""}            

                {props.hasBottomHandle? 
                <div className="ResizableContainerHandle ContainerVertHandle ContainerBottomHandle" onPointerDown={(e)=>handlePointerDown(e,"bottom")}
                style={{height: `${handleSize}px`}}/> : ""}

                {props.hasBottomHandle && props.hasRightHandle?
                <div className="ResizableContainerHandle ContainerCornerHandle ContainerBottomRightHandle" onPointerDown={(e)=>handlePointerDown(e,"bottom-right")}
                style={{height: `${handleSize}px`, width: `${handleSize}px`}}/> : ""}
            </div>
        </div>
    </div>
}