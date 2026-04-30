import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import "../src/Editor.css";
import EditorCanvas from "./editorWidgets/EditorCanvas";
import { type ObjectProperties } from "./RenderableObjectTypes";
import { Vector3 } from "./math/vector3.type";
import type { Camera } from "./classes/camera";
import CameraPropertiesWidget from "./editorWidgets/CameraPropertiesWidget";
import { VoxelObject } from "./classes/voxelObject";
import { getBasicSampleVoxelObject } from "./sampleObjects";
import ResizableContainer, {
  type ResizableContainerConsts,
} from "./editorWidgets/ResizableContainer";
import { ActionButtonsPanel, type ActionButtonData } from "./editorWidgets/ActionButtonsPanel";
import { EditToolsWidget } from "./editorWidgets/EditToolsWidget";
import { SelectToolsWidget } from "./editorWidgets/SelectToolsWidget";
import { Scene } from "./classes/scene";
import { Renderer } from "./classes/renderer";
import { ControllerContext } from "./ControllerContext";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export type SelectMode = 
| "Voxel"
| "Cube"
| "Face"

export type EditMode = 
| "Add"
| "Paint"
| "Remove"
| "Move"
| "None"

export default function EditorPage() {
  const controller = useContext(ControllerContext)!;
  const currentSelectionTypeRef = useRef<SelectMode>("Voxel");
  const currentEditTypeRef = useRef<EditMode>("Add");

  //states for updating widgets when controller changes some data
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

  const selectedObjectPropertiesRef =
    useRef<ObjectProperties>({
      translation: new Vector3(0, 0, -500),
      scale: new Vector3(1, 1, 1),
      rotation: new Vector3(0, 0, 0),
    });

  const selectedObjectRef = useRef<VoxelObject>(
    getBasicSampleVoxelObject()
  );
  const selectedCameraRef = useRef<Camera>({
    fovY: 90,
    near: 0.1,
    far: 5000,
    transform: {
      translation: new Vector3(0, 0, 0),
      scale: new Vector3(1, 1, 1),
      rotation: new Vector3(0, 0, 0),
    },
    projectionType: "perspective",
    distance: 500,
    target: new Vector3(0,0,-500),
    pitch: 0,
    yaw: 0,
  });
  /*
  const [renderOptions, _] = useState<RenderOptions>({
    voxels: true,
    objectGrid: true,
    borderWire: true,
    borderGrid: true,
  });*/

  const sceneRef = useRef<Scene>(new Scene(selectedObjectRef.current, selectedCameraRef.current));
  const rendererRef = useRef<Renderer>(new Renderer());
  
  useEffect(()=>{
    if(selectedCameraRef.current==null) return;
    
    controller.init(selectedCameraRef.current, currentSelectionTypeRef, currentEditTypeRef, sceneRef.current, rerenderScene);
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

  const [leftPanelWidth, setLeftPanelWidth] = useState(200);
  const [rightPanelWidth, setRightPanelWidth] = useState(200);
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
    if(!sceneRef.current.initialized || !rendererRef.current.initialized) return;
    rerenderScene();
  }

  //scene rerender
  let rerenderOrderedRef = useRef<boolean>(false);
  const rerenderScene = useCallback(() => {
  if (
    rerenderOrderedRef.current ||
    !sceneRef.current.initialized ||
    !rendererRef.current.initialized
  ) return;

  rerenderOrderedRef.current = true;
  
  requestAnimationFrame(() => {
    rendererRef.current.renderScene(sceneRef.current);
    rerenderOrderedRef.current = false;
  });
}, []);


  /*
  const [isTransformObjectPropertiesOpen, setIsTransformObjectPropertiesOpen] = useState<boolean>(false);
  const objectPropertiesWidget = <ObjectPropertiesWidget
    objectProperties={selectedObjectProperties}
    onPropertiesChange={setSelectedObjectProperties}
    voxelObject={selectedObject}
    setVoxelObject={setSelectedObject}
    isOpen={isTransformObjectPropertiesOpen}
    onOpenChange={setIsTransformObjectPropertiesOpen}
  />*/
  
  const [isCameraPropertiesWidgetOpen, setIsCameraPropertiesWidgetOpen] = useState<boolean>(false);
  const cameraPropertiesWidget : React.ReactNode = <CameraPropertiesWidget
    camera={selectedCameraRef.current}
    isOpen={isCameraPropertiesWidgetOpen}
    onOpenChange={setIsCameraPropertiesWidgetOpen}
    cameraVersion={cameraPropertiesVersion}
  />

  //const [currentSelectionType , setCurrentSelectionType] = useState<SelectMode>("Voxel");
  
  const [isSelectToolsWidgetOpen, setIsSelectToolsWidgetOpen] = useState<boolean>(false);
  const selectToolsButton : ActionButtonData[] = [
    {
      id: "voxelSelectButton",
      label: "voxel",
      onClick: () => {currentSelectionTypeRef.current = "Voxel"; onSelectToolsUpdated()},
      disabled: currentSelectionTypeRef.current==="Voxel",
    },
    {
      id: "cubeSelectButton",
      label: "cube",
      onClick: () => {currentSelectionTypeRef.current = "Cube"; onSelectToolsUpdated()},
      disabled: currentSelectionTypeRef.current==="Cube",
    },
    {
      id: "faceSelectButton",
      label: "face",
      onClick: () => {currentSelectionTypeRef.current = "Face"; onSelectToolsUpdated()},
      disabled: currentSelectionTypeRef.current==="Face",
    },
  ];

  const selectToolsButtons : React.ReactNode = <ActionButtonsPanel
    buttons={selectToolsButton}
  />

  const selectToolsWidget : React.ReactNode = <SelectToolsWidget
    buttonPanel = {selectToolsButtons}
    isOpen = {isSelectToolsWidgetOpen}
    onOpenChange={setIsSelectToolsWidgetOpen}
    selectToolsVersion = {selectToolsPropertiesVersion}
  />

  
  const [isEditToolsWidgetOpen, setIsEditToolsWidgetOpen] = useState<boolean>(false);
  const editToolsButton : ActionButtonData[] = [
    {
      id: "AddEditButton",
      label: "add",
      onClick: () => {currentEditTypeRef.current="Add"; onEditToolsUpdated()},
      disabled: currentEditTypeRef.current==="Add",
    },
    {
      id: "RemoveEditButton",
      label: "remove",
      onClick: () => {currentEditTypeRef.current = "Remove"; onEditToolsUpdated()},
      disabled: currentEditTypeRef.current==="Remove",
    },
    {
      id: "PaintEditButton",
      label: "paint",
      onClick: () => {currentEditTypeRef.current = "Paint"; onEditToolsUpdated()},
      disabled: currentEditTypeRef.current==="Paint",
    },
    {
      id: "MoveEditButton",
      label: "move",
      onClick: () => {currentEditTypeRef.current = "Move"; onEditToolsUpdated()},
      disabled: currentEditTypeRef.current==="Move",
    },
    {
      id: "NoneEditButton",
      label: "None",
      onClick: () => {currentEditTypeRef.current = "None"; onEditToolsUpdated()},
      disabled: currentEditTypeRef.current==="None",
    },
  ];

  const editToolsButtons : React.ReactNode = <ActionButtonsPanel
    buttons={editToolsButton}
  />

  const editToolsWidget : React.ReactNode = <EditToolsWidget
    buttonPanel = {editToolsButtons}
    isOpen = {isEditToolsWidgetOpen}
    onOpenChange={setIsEditToolsWidgetOpen}
    editToolVersion={editToolsPropertiesVersion}
  />
  
  return (
    <div className="EditorPage">
      <div className="EditorNav"></div>
      <div className="EditorBody">
        <div className="EditorBodyHorizontal" ref={bodyHorizontalRef}>
          <div className="EditorBodyLeft">
            <ResizableContainer
              children={
                null
              }
              width={leftPanelWidth}
              height={null}
              onWidthChange={onLeftPanelWidthChange}
              onHeightChange={null}
              hasRightHandle={true}
              hasLeftHandle={false}
              hasBottomHandle={false}
              hasTopHandle={false}
            />
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
              objectProperties={selectedObjectPropertiesRef.current}
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
              {/*{objectPropertiesWidget}*/}
              {cameraPropertiesWidget}
              {selectToolsWidget}
              {editToolsWidget}
              </div>
            </ResizableContainer>
          </div>
        </div>
      </div>
    </div>
  );
}