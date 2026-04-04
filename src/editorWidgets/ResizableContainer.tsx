import React, { useEffect, useState } from "react";
import "../editorWidgets/ResizableContainer.css";

export type ResizableContainerConsts = {
  maxWidth: number;
  minWidth: number;
  maxHeight: number;
  minHeight: number;
};

export type ResizableContainerProps = {
  child: React.ReactNode | null;

  width: number | null;
  height: number | null;

  onWidthChange?: ((w: number) => void) | null;
  onHeightChange?: ((h: number) => void) | null;

  hasLeftHandle: boolean;
  hasRightHandle: boolean;
  hasTopHandle: boolean;
  hasBottomHandle: boolean;
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

type ResizeSession = {
  direction: ResizeDirection;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
} | null;

export default function ResizableContainer(props: ResizableContainerProps) {
  const [resizeSession, setResizeSession] = useState<ResizeSession>(null);
  const handleSize = 8;

  function handlePointerDown(
    e: React.PointerEvent<HTMLDivElement>,
    direction: ResizeDirection
  ) {
    e.preventDefault();
    e.stopPropagation();

    setResizeSession({
      startX: e.clientX,
      startY: e.clientY,
      startWidth: props.width ?? 0,
      startHeight: props.height ?? 0,
      direction,
    });
  }

  useEffect(() => {
    if (resizeSession == null) return;

    function handlePointerMove(e: PointerEvent) {
      if (!resizeSession) return;

      const deltaX = e.clientX - resizeSession.startX;
      const deltaY = e.clientY - resizeSession.startY;

      const isHorizontal =
        resizeSession.direction === "left" ||
        resizeSession.direction === "right" ||
        resizeSession.direction === "top-left" ||
        resizeSession.direction === "top-right" ||
        resizeSession.direction === "bottom-left" ||
        resizeSession.direction === "bottom-right";

      const isVertical =
        resizeSession.direction === "top" ||
        resizeSession.direction === "bottom" ||
        resizeSession.direction === "top-left" ||
        resizeSession.direction === "top-right" ||
        resizeSession.direction === "bottom-left" ||
        resizeSession.direction === "bottom-right";

      if (isHorizontal && props.onWidthChange) {
        const nextWidth = resizeSession.direction.includes("left")
          ? resizeSession.startWidth - deltaX
          : resizeSession.startWidth + deltaX;

        props.onWidthChange(nextWidth);
      }

      if (isVertical && props.onHeightChange) {
        const nextHeight = resizeSession.direction.includes("top")
          ? resizeSession.startHeight - deltaY
          : resizeSession.startHeight + deltaY;

        props.onHeightChange(nextHeight);
      }
    }

    function handlePointerUp() {
      setResizeSession(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [resizeSession, props.onWidthChange, props.onHeightChange]);

  return (
    <div
      className="ResizableContainer"
      style={{
        width: props.width != null ? `${props.width}px` : "100%",
        height: props.height != null ? `${props.height}px` : "100%",
      }}
    >
      <div className="ResizableContainerVert">
        <div className="ResizableContainerTop">
          {props.hasTopHandle && props.hasLeftHandle ? (
            <div
              className="ResizableContainerHandle ContainerCornerHandle ContainerTopLeftHandle"
              onPointerDown={(e) => handlePointerDown(e, "top-left")}
              style={{ width: `${handleSize}px`, height: `${handleSize}px` }}
            />
          ) : null}

          {props.hasTopHandle ? (
            <div
              className="ResizableContainerHandle ContainerVertHandle ContainerTopHandle"
              onPointerDown={(e) => handlePointerDown(e, "top")}
              style={{ height: `${handleSize}px` }}
            />
          ) : null}

          {props.hasTopHandle && props.hasRightHandle ? (
            <div
              className="ResizableContainerHandle ContainerCornerHandle ContainerTopRightHandle"
              onPointerDown={(e) => handlePointerDown(e, "top-right")}
              style={{ width: `${handleSize}px`, height: `${handleSize}px` }}
            />
          ) : null}
        </div>

        <div className="ResizableContainerHor">
          {props.hasLeftHandle ? (
            <div
              className="ResizableContainerHandle ContainerHorHandle ContainerLeftHandle"
              onPointerDown={(e) => handlePointerDown(e, "left")}
              style={{ width: `${handleSize}px` }}
            />
          ) : null}

          <div className="ResizableContainerChildWrapper">{props.child}</div>

          {props.hasRightHandle ? (
            <div
              className="ResizableContainerHandle ContainerHorHandle ContainerRightHandle"
              onPointerDown={(e) => handlePointerDown(e, "right")}
              style={{ width: `${handleSize}px` }}
            />
          ) : null}
        </div>

        <div className="ResizableContainerBottom">
          {props.hasBottomHandle && props.hasLeftHandle ? (
            <div
              className="ResizableContainerHandle ContainerCornerHandle ContainerBottomLeftHandle"
              onPointerDown={(e) => handlePointerDown(e, "bottom-left")}
              style={{ width: `${handleSize}px`, height: `${handleSize}px` }}
            />
          ) : null}

          {props.hasBottomHandle ? (
            <div
              className="ResizableContainerHandle ContainerVertHandle ContainerBottomHandle"
              onPointerDown={(e) => handlePointerDown(e, "bottom")}
              style={{ height: `${handleSize}px` }}
            />
          ) : null}

          {props.hasBottomHandle && props.hasRightHandle ? (
            <div
              className="ResizableContainerHandle ContainerCornerHandle ContainerBottomRightHandle"
              onPointerDown={(e) => handlePointerDown(e, "bottom-right")}
              style={{ width: `${handleSize}px`, height: `${handleSize}px` }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}