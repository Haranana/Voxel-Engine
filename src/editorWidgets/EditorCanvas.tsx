import {  useContext, useEffect, useRef } from "react";
import type { ObjectProperties } from "../RenderableObjectTypes";
import { Vector2 } from "../math/vector2.type";
import type { Renderer } from "../classes/renderer";
import type { Scene } from "../classes/scene";
import { ControllerContext } from "../ControllerContext";

export type EditorCanvasProps = {
    renderer: Renderer,
    scene: Scene,
    onRenderAndSceneInit: ()=>void,
    renderScene: ()=>void,
    objectProperties: ObjectProperties;
}

export default function EditorCanvas(props: EditorCanvasProps) {
    const controller = useContext(ControllerContext)!;
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    function getMousePos(canvas: HTMLCanvasElement, evt: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    var rect = canvas.getBoundingClientRect();
        return {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
        };
    }
    
    function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>){
        if(!canvasRef.current) return; 
        const clickPos = new Vector2(getMousePos(canvasRef.current, e).x , getMousePos(canvasRef.current, e).y);

        if(e.button === 0){
            controller.handleCanvasPointerDown(clickPos);
        }else if(e.button===2){ 
            controller.startCameraMoveSession(clickPos);
        }
    }

    function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>){
        if(!canvasRef.current) return; 
        const clickPos = new Vector2(getMousePos(canvasRef.current, e).x , getMousePos(canvasRef.current, e).y);

        controller.updateCameraMoveSession(clickPos);
        controller.handleCanvasPointerMove(clickPos);
    }

    function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>){
        if(!canvasRef.current) return; 
        const clickPos = new Vector2(getMousePos(canvasRef.current, e).x , getMousePos(canvasRef.current, e).y);
        controller.endCameraMoveSession();
        controller.handleCanvasPointerUp(clickPos);

    }

    function handlePointerCancel(_: React.PointerEvent<HTMLCanvasElement>){
        if(!canvasRef.current) return; 

    }

    useEffect(()=>{
        const canvas = canvasRef.current;
        if (!canvas) return;

        const run = async () => {
            await props.renderer.init(canvas);
            props.scene.init(canvas);
            props.scene.setObjectTransformMatrix(props.objectProperties);
            props.onRenderAndSceneInit();
        };

        run();
    }, []);

    const pressedKeysRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        

        const handleKeyDown = (e: KeyboardEvent) => {
        pressedKeysRef.current.add(e.key.toLowerCase());
        }

        const handleKeyUp = (e: KeyboardEvent) => {
        pressedKeysRef.current.delete(e.key.toLowerCase());
        }

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            controller.setCameraDistanceByWheel(e.deltaY);
        };

        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.addEventListener("wheel", handleWheel);
        return () => {
            canvas.removeEventListener("wheel", handleWheel);
        };

    }, []);

  return (
    <div className="CanvasContainer">
        <canvas
        ref={canvasRef}
        onContextMenu={(e)=>e.preventDefault()}
        
        onPointerDown={(e) => handlePointerDown(e)}
        onPointerUp={(e)=>handlePointerUp(e)}
        onPointerCancel={(e)=>handlePointerCancel(e)}
        onPointerMove={e=>handlePointerMove(e)}
        
        className="EditorMainCanvas"
        />
    </div>
  );
}
