import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import "./Editor.css"
import { getFlipRotationTestSampleVoxelObject } from "../../voxel_engine/scene-objects/voxel/sample-voxel-objects";
import { Renderer, type RenderContext } from "../../render_engine/renderer";
import { ControllerContext } from "../editor_controller/ControllerContext";
import { Scene } from "../../voxel_engine/scene/scene";
import type { VoxelObject } from "../../voxel_engine/scene-objects/voxel/voxel-object";
import type { ResizableContainerConsts } from "../editor_widgets/ResizableContainer";
import { Vector2 } from "../../math/vector2.type";
import { SceneRenderCollector } from "../../voxel_engine/scene/scene-render-collector";
import CameraPropertiesWidget from "../editor_widgets/camera_properties/CameraPropertiesWidget";
import { ActionButtonsPanel, type ActionButtonData } from "../editor_widgets/ActionButtonsPanel";
import { SelectToolsWidget } from "../editor_widgets/select_tools/SelectToolsWidget";
import { EditToolsWidget } from "../editor_widgets/edit_tools/EditToolsWidget";
import ScenePropertiesWidget from "../editor_widgets/scene_properties/ScenePropertiesWidget";
import { ColorPaletteWidget } from "../editor_widgets/ColorPaletteWidget";
import { EditVoxelObjectWidget } from "../editor_widgets/edit_voxel_object/EditVoxelObjectWidget";
import ResizableContainer from "../editor_widgets/ResizableContainer";
import EditorCanvas from "../editor_widgets/EditorCanvas";
import { SceneListWidget } from "../editor_widgets/scene_list/SceneListWidget";
import { getSampleCamera } from "../../voxel_engine/scene-objects/camera/sample-cameras";
import { EditSelectedVoxelsWidget } from "../editor_widgets/edit_selected_voxels/EditSelectedVoxelsWidget";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function EditorPage() {

  const controller = useContext(ControllerContext)!;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene>(new Scene());
  const rendererRef = useRef<Renderer>(new Renderer());

  //states for updating widgets when controller changes data
  const [cameraPropertiesVersion, setCameraPropertiesVersion] = useState<number>(0);
  function onCameraUpdated(){
    setCameraPropertiesVersion(prev=>prev+1);
  }

  const [selectToolsPropertiesVersion, setSelectToolsPropertiesVersion] = useState<number>(0);
  function onSelectToolsUpdated(){
    setSelectToolsPropertiesVersion(prev=>prev+1);
  }

  const [editToolsPropertiesVersion, setEditToolsPropertiesVersion] = useState<number>(0);
  function onEditToolsUpdated(){
    setEditToolsPropertiesVersion(prev=>prev+1);
  }

  //init starting scene
  const startingSceneInitializedRef = useRef<boolean>(false);
  useEffect(()=>{
    if(startingSceneInitializedRef.current) return;
    startingSceneInitializedRef.current = true;
    
    const obj: VoxelObject = getFlipRotationTestSampleVoxelObject("SampleObject")     
    sceneRef.current.addObject(obj);

    sceneRef.current.addObject(getSampleCamera("MainCamera"));
  },[])

  useEffect(()=>{
    if(!sceneRef.current.getActiveCamera()) return;
    
    controller.init(sceneRef.current, rerenderScene, (p: Vector2)=>rendererRef.current.readIdPixel(p));
    controller.onCameraModified = onCameraUpdated;
  },[]);
  
  const bodyHorizontalRef = useRef<HTMLDivElement | null>(null);
  const bodyVerticalRef = useRef<HTMLDivElement | null>(null);

  const [horizontalWidth, setHorizontalWidth] = useState(0);
  const [verticalHeight, setVerticalHeight] = useState(0);

  const centerMinWidth = 300;
  const centerMinHeight = 250;

  const leftPanelData: ResizableContainerConsts = useMemo(
    () => ({
      maxWidth: 300,
      minWidth: 150,
      maxHeight: 2000,
      minHeight: 400,
    }),
    []
  );

  const rightPanelData: ResizableContainerConsts = useMemo(
    () => ({
      maxWidth: 300,
      minWidth: 150,
      maxHeight: 2000,
      minHeight: 400,
    }),
    []
  );

  const topPanelData: ResizableContainerConsts = useMemo(
    () => ({
      maxWidth: 2000,
      minWidth: 400,
      maxHeight: 50,
      minHeight: 25,
    }),
    []
  );

  const bottomPanelData: ResizableContainerConsts = useMemo(
    () => ({
      maxWidth: 2000,
      minWidth: 400,
      maxHeight: 50,
      minHeight: 25,
    }),
    []
  );

  const [leftPanelWidth, setLeftPanelWidth] = useState(150);
  const [rightPanelWidth, setRightPanelWidth] = useState(300);
  const [topPanelHeight, setTopPanelHeight] = useState(50);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(50);

  const onLeftPanelWidthChange = (w: number) => {
    const declaredClamped = clamp(w, leftPanelData.minWidth, leftPanelData.maxWidth);
    const realMaxWidth = Math.max(
      leftPanelData.minWidth,
      horizontalWidth - rightPanelWidth - centerMinWidth
    );
    const finalWidth = clamp(
      declaredClamped,
      leftPanelData.minWidth,
      realMaxWidth
    );
    setLeftPanelWidth(finalWidth);
  };

  const onRightPanelWidthChange = (w: number) => {
    const declaredClamped = clamp(
      w,
      rightPanelData.minWidth,
      rightPanelData.maxWidth
    );
    const realMaxWidth = Math.max(
      rightPanelData.minWidth,
      horizontalWidth - leftPanelWidth - centerMinWidth
    );
    const finalWidth = clamp(
      declaredClamped,
      rightPanelData.minWidth,
      realMaxWidth
    );
    setRightPanelWidth(finalWidth);
  };

  const onTopPanelHeightChange = (h: number) => {
    const declaredClamped = clamp(
      h,
      topPanelData.minHeight,
      topPanelData.maxHeight
    );
    const realMaxHeight = Math.max(
      topPanelData.minHeight,
      verticalHeight - bottomPanelHeight - centerMinHeight
    );
    const finalHeight = clamp(
      declaredClamped,
      topPanelData.minHeight,
      realMaxHeight
    );
    setTopPanelHeight(finalHeight);
  };

  const onBottomPanelHeightChange = (h: number) => {
    const declaredClamped = clamp(
      h,
      bottomPanelData.minHeight,
      bottomPanelData.maxHeight
    );
    const realMaxHeight = Math.max(
      bottomPanelData.minHeight,
      verticalHeight - topPanelHeight - centerMinHeight
    );
    const finalHeight = clamp(
      declaredClamped,
      bottomPanelData.minHeight,
      realMaxHeight
    );
    setBottomPanelHeight(finalHeight);
  };

  useEffect(() => {
    if (!bodyHorizontalRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setHorizontalWidth(entry.contentRect.width);
    });

    observer.observe(bodyHorizontalRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!bodyVerticalRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setVerticalHeight(entry.contentRect.height);
    });

    observer.observe(bodyVerticalRef.current);
    return () => observer.disconnect();
  }, []);
  

  useEffect(() => {
    if (horizontalWidth <= 0) return;

    const clampedLeft = clamp(
      leftPanelWidth,
      leftPanelData.minWidth,
      Math.max(leftPanelData.minWidth, horizontalWidth - rightPanelWidth - centerMinWidth)
    );

    const clampedRight = clamp(
      rightPanelWidth,
      rightPanelData.minWidth,
      Math.max(
        rightPanelData.minWidth,
        horizontalWidth - clampedLeft - centerMinWidth
      )
    );

    const finalLeft = clamp(
      clampedLeft,
      leftPanelData.minWidth,
      Math.max(leftPanelData.minWidth, horizontalWidth - clampedRight - centerMinWidth)
    );

    if (finalLeft !== leftPanelWidth) setLeftPanelWidth(finalLeft);
    if (clampedRight !== rightPanelWidth) setRightPanelWidth(clampedRight);
  }, [
    horizontalWidth,
    leftPanelWidth,
    rightPanelWidth,
    centerMinWidth,
    leftPanelData,
    rightPanelData,
  ]);
 
  useEffect(() => {
    if (verticalHeight <= 0) return;

    const clampedTop = clamp(
      topPanelHeight,
      topPanelData.minHeight,
      Math.max(topPanelData.minHeight, verticalHeight - bottomPanelHeight - centerMinHeight)
    );

    const clampedBottom = clamp(
      bottomPanelHeight,
      bottomPanelData.minHeight,
      Math.max(
        bottomPanelData.minHeight,
        verticalHeight - clampedTop - centerMinHeight
      )
    );

    const finalTop = clamp(
      clampedTop,
      topPanelData.minHeight,
      Math.max(topPanelData.minHeight, verticalHeight - clampedBottom - centerMinHeight)
    );

    if (finalTop !== topPanelHeight) setTopPanelHeight(finalTop);
    if (clampedBottom !== bottomPanelHeight) setBottomPanelHeight(clampedBottom);
  }, [
    verticalHeight,
    topPanelHeight,
    bottomPanelHeight,
    centerMinHeight,
    topPanelData,
    bottomPanelData,
  ]);

  const onRenderAndSceneInit = () => {
    if(!rendererRef.current.initialized) return;
    rerenderScene();
  }

  //scene rerender
  let rerenderOrderedRef = useRef<boolean>(false);
  const rerenderScene = useCallback(() => {
    if (
      rerenderOrderedRef.current ||
      !rendererRef.current.initialized
    ) return;

    rerenderOrderedRef.current = true;
    
    requestAnimationFrame(() => {
      const camera = sceneRef.current.getActiveCamera();
      
      const scene = sceneRef.current;
      if(!camera || !canvasRef.current){
        return;
      }
      const resolution = new Vector2(canvasRef.current.width, canvasRef.current.height);

      const renderContext: RenderContext = {
        device: null,
        queue: null,
        cameraContext: {
          viewMatrix: camera.getCameraView(),
          ndcProjection: camera.getProjectionMatrix(resolution),       
        },
        viewportContext: {
          resolution,
        },
        timeContext:  null,
        gizmoCameraContext: {
          pitch: camera.pitch,
          yaw: camera.yaw,
        },
        globalData: null,
      }

      rendererRef.current.renderScene(SceneRenderCollector.collect(scene, camera), renderContext);
      rerenderOrderedRef.current = false;
    });
  }, []);
  
  const [isCameraPropertiesWidgetOpen, setIsCameraPropertiesWidgetOpen] = useState<boolean>(false);
  const cameraPropertiesWidget : React.ReactNode = <CameraPropertiesWidget
    isOpen={isCameraPropertiesWidgetOpen}
    onOpenChange={setIsCameraPropertiesWidgetOpen}
    onValueChange={()=>setCameraPropertiesVersion(prev=>(prev+1))}
  />
  
  const [isSelectToolsWidgetOpen, setIsSelectToolsWidgetOpen] = useState<boolean>(true);
  const selectToolsWidget : React.ReactNode = <SelectToolsWidget
    isOpen = {isSelectToolsWidgetOpen}
    onOpenChange={setIsSelectToolsWidgetOpen}
    onValueChange = {()=>setSelectToolsPropertiesVersion((prev)=>(prev+1))}
  />

  
  const [isEditToolsWidgetOpen, setIsEditToolsWidgetOpen] = useState<boolean>(true);
  const editToolsWidget : React.ReactNode = <EditToolsWidget
    isOpen = {isEditToolsWidgetOpen}
    onOpenChange={setIsEditToolsWidgetOpen}
    onValueChange={()=>setEditToolsPropertiesVersion(prev=>(prev+1))}
  />

  //Scene properties
  const [scenePropertiesVersion, setScenePropertiesVersion] = useState<number>(0);
  function onScenePropertiesUpdated(){
    setScenePropertiesVersion(prev=>prev+1);
  }
  const [isScenePropertiesWidgetOpen, setIsScenePropertiesWidgetOpen] = useState<boolean>(false);


  const scenePropertiesWidget : React.ReactNode = <ScenePropertiesWidget
    isOpen = {isScenePropertiesWidgetOpen}
    onOpenChange={setIsScenePropertiesWidgetOpen}
    onValueChange = {()=>setScenePropertiesVersion((prev)=>prev+1)}
    version={scenePropertiesVersion}
  />

  const sceneListWidget: React.ReactNode = <SceneListWidget></SceneListWidget>
  
  const [colorPaletteVersion, setColorPaletteVersion] = useState<number>(0);
  function onColorPaletteVersion(){
    setScenePropertiesVersion(prev=>prev+1);
  }
  const [isColorPaletteOpen, setIscolorPaletteOpen] = useState<boolean>(true);
  const colorPaletteWidget: React.ReactNode = <ColorPaletteWidget
        isOpen={isColorPaletteOpen}
        onOpenChange={setIscolorPaletteOpen}
        version={colorPaletteVersion}
  />

  const [editObjectVersion, setEditObjectVersion] = useState<number>(0);
  const [isEditVoxelObjectWidgetOpen, setEditVoxelObjectWidgetOpen] = useState<boolean>(false);
  const editVoxelObjectWidget: React.ReactNode = <EditVoxelObjectWidget
        isOpen={isEditVoxelObjectWidgetOpen}
        onOpenChange={setEditVoxelObjectWidgetOpen}
        onValueChange={()=>{setEditObjectVersion(prev=>(prev+1))}}
        version={editObjectVersion}
  />

  const [isEditSelectedVoxelsWidgetOpen, setEditSelectedVoxelsWidgetOpen] = useState<boolean>(false);
  const editSelectedVoxelsWidget: React.ReactNode = <EditSelectedVoxelsWidget
    isOpen = {isEditSelectedVoxelsWidgetOpen}
    onOpenChange={setEditSelectedVoxelsWidgetOpen}
  />

  return (
    <div className="EditorPage">
      <div className="EditorNav"></div>
      <div className="EditorBody">
        <ControllerContext value={controller}>
          <div className="EditorBodyHorizontal" ref={bodyHorizontalRef}>
            <div className="EditorBodyLeft">
              <ResizableContainer
                width={leftPanelWidth}
                height={null}
                onWidthChange={onLeftPanelWidthChange}
                onHeightChange={null}
                hasRightHandle={true}
                hasLeftHandle={false}
                hasBottomHandle={false}
                hasTopHandle={false}
              >
                <div className="ResizableContainerChildWrapper">
                {colorPaletteWidget}
                {selectToolsWidget}
                {editToolsWidget}
                </div>
              </ResizableContainer>
            </div>

            <div className="EditorBodyVertical" ref={bodyVerticalRef}>
              <div className="EditorBodyTop">
                <ResizableContainer
                  children={<p></p>}
                  width={null}
                  height={topPanelHeight}
                  onWidthChange={null}
                  onHeightChange={onTopPanelHeightChange}
                  hasRightHandle={false}
                  hasLeftHandle={false}
                  hasBottomHandle={true}
                  hasTopHandle={false}
                />
              </div>

              <div className="EditorBodyCenter">
                <EditorCanvas
                renderer={rendererRef.current}
                scene={sceneRef.current}
                renderScene = {rerenderScene}
                onRenderAndSceneInit={onRenderAndSceneInit}
                canvasRef={canvasRef}
                />
              </div>

              <div className="EditorBodyBottom">
                <ResizableContainer
                  children={<p></p>}
                  width={null}
                  height={bottomPanelHeight}
                  onWidthChange={null}
                  onHeightChange={onBottomPanelHeightChange}
                  hasRightHandle={false}
                  hasLeftHandle={false}
                  hasBottomHandle={false}
                  hasTopHandle={true}
                />
              </div>
            </div>

            <div className="EditorBodyRight">
              <ResizableContainer
                width={rightPanelWidth}
                height={null}
                onWidthChange={onRightPanelWidthChange}
                onHeightChange={null}
                hasRightHandle={false}
                hasLeftHandle={true}
                hasBottomHandle={false}
                hasTopHandle={false}
              >
                <div className="ResizableContainerChildWrapper">
                {sceneListWidget}
                {/*{objectPropertiesWidget}*/}
                {cameraPropertiesWidget}
                {scenePropertiesWidget}                
                {editVoxelObjectWidget}
                {editSelectedVoxelsWidget}
                </div>
              </ResizableContainer>
            </div>
            
          </div>
        </ControllerContext>          
      </div>
    </div>
  );
}