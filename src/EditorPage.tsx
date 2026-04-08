import React, { useEffect, useMemo, useRef, useState } from "react";
import "../src/Editor.css";
import EditorCanvas from "./editorWidgets/EditorCanvas";
import { type RenderMode, type ObjectProperties } from "./RenderableObjectTypes";
import { Vector3 } from "./math/vector3.type";
import type { Camera } from "./classes/camera";
import CameraPropertiesWidget from "./editorWidgets/CameraPropertiesWidget";
import { VoxelObject } from "./classes/voxelObject";
import { getBasicSampleVoxelObject } from "./sampleObjects";
import ResizableContainer, {
  type ResizableContainerConsts,
} from "./editorWidgets/ResizableContainer";
import ObjectPropertiesWidget from "./editorWidgets/ObjectPropertiesWidget";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function EditorPage() {
  const [selectedObjectProperties, setSelectedObjectProperties] =
    useState<ObjectProperties>({
      translation: new Vector3(0, 0, -500),
      scale: new Vector3(1, 1, 1),
      rotation: new Vector3(0, 0, 0),
    });

  const [selectedObject, setSelectedObject] = useState<VoxelObject>(
    getBasicSampleVoxelObject()
  );
  const [selectedRenderMode, _] =
    useState<RenderMode>("TriangleWireframe");


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

  const [selectedCamera, setSelectedCamera] = useState<Camera>({
    fovY: 90,
    near: 0.1,
    far: 1000,
    transform: {
      translation: new Vector3(0, 0, 0),
      scale: new Vector3(1, 1, 1),
      rotation: new Vector3(0, 0, 0),
    },
    projectionType: "perspective",
  });

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

  const onSelectedObjectChanged = (newObject: VoxelObject) => {
    setSelectedObject(newObject);
  };

  const [isTransformObjectPropertiesOpen, setIsTransformObjectPropertiesOpen] = useState<boolean>(false);
const objectPropertiesWidget = <ObjectPropertiesWidget
    objectProperties={selectedObjectProperties}
    onPropertiesChange={setSelectedObjectProperties}
    isOpen={isTransformObjectPropertiesOpen}
    onOpenChange={setIsTransformObjectPropertiesOpen}
/>
  
  const [isCameraPropertiesWidgetOpen, setIsCameraPropertiesWidgetOpen] = useState<boolean>(false);
  const cameraPropertiesWidget : React.ReactNode = <CameraPropertiesWidget
    camera={selectedCamera}
    onCameraChange={setSelectedCamera}
    isOpen={isCameraPropertiesWidgetOpen}
    onOpenChange={setIsCameraPropertiesWidgetOpen}
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
                children={<p>Top toolbar placeholder</p>}
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
                objectProperties={selectedObjectProperties}
                camera={selectedCamera}
                onSelectedObjectChanged={onSelectedObjectChanged}
                selectedObject={selectedObject}
                renderMode={selectedRenderMode}
              />
            </div>

            <div className="EditorBodyBottom">
              <ResizableContainer
                children={<p>Bottom toolbar placeholder</p>}
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
              {objectPropertiesWidget}
              {cameraPropertiesWidget}
              </div>
            </ResizableContainer>
          </div>
        </div>
      </div>
    </div>
  );
}