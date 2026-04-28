import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type Placement = "left" | "right" | "top" | "bottom";

type ExpandableButtonProps = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  preferredPlacement?: Placement;
  offset?: number;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type Position = {
  top: number;
  left: number;
  placement: Placement;
};

const VIEWPORT_MARGIN = 8;

function getPlacementOrder(preferred: Placement): Placement[] {
  switch (preferred) {
    case "left":
      return ["left", "right", "bottom", "top"];
    case "right":
      return ["right", "left", "bottom", "top"];
    case "top":
      return ["top", "bottom", "right", "left"];
    case "bottom":
      return ["bottom", "top", "right", "left"];
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function computeCandidatePosition(
  placement: Placement,
  anchorRect: DOMRect,
  panelRect: DOMRect,
  offset: number
): Omit<Position, "placement"> {
  switch (placement) {
    case "right":
      return {
        left: anchorRect.right + offset,
        top: anchorRect.top + (anchorRect.height - panelRect.height) / 2,
      };
    case "left":
      return {
        left: anchorRect.left - panelRect.width - offset,
        top: anchorRect.top + (anchorRect.height - panelRect.height) / 2,
      };
    case "bottom":
      return {
        left: anchorRect.left + (anchorRect.width - panelRect.width) / 2,
        top: anchorRect.bottom + offset,
      };
    case "top":
      return {
        left: anchorRect.left + (anchorRect.width - panelRect.width) / 2,
        top: anchorRect.top - panelRect.height - offset,
      };
  }
}

function fitsViewport(
  left: number,
  top: number,
  panelRect: DOMRect,
  viewportWidth: number,
  viewportHeight: number
) {
  return (
    left >= VIEWPORT_MARGIN &&
    top >= VIEWPORT_MARGIN &&
    left + panelRect.width <= viewportWidth - VIEWPORT_MARGIN &&
    top + panelRect.height <= viewportHeight - VIEWPORT_MARGIN
  );
}

function resolveBestPosition(
  preferredPlacement: Placement,
  anchorRect: DOMRect,
  panelRect: DOMRect,
  offset: number
): Position {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const order = getPlacementOrder(preferredPlacement);

  for (const placement of order) {
    const candidate = computeCandidatePosition(
      placement,
      anchorRect,
      panelRect,
      offset
    );

    if (
      fitsViewport(
        candidate.left,
        candidate.top,
        panelRect,
        viewportWidth,
        viewportHeight
      )
    ) {
      return {
        ...candidate,
        placement,
      };
    }
  }

  // nic nie pasuje idealnie -> bierz preferowany kierunek i clampuj
  const fallback = computeCandidatePosition(
    preferredPlacement,
    anchorRect,
    panelRect,
    offset
  );

  return {
    placement: preferredPlacement,
    left: clamp(
      fallback.left,
      VIEWPORT_MARGIN,
      viewportWidth - panelRect.width - VIEWPORT_MARGIN
    ),
    top: clamp(
      fallback.top,
      VIEWPORT_MARGIN,
      viewportHeight - panelRect.height - VIEWPORT_MARGIN
    ),
  };
}

export default function ExpandableButton({
  trigger,
  children,
  preferredPlacement = "right",
  offset = 8,
  defaultOpen = false,
  isOpen,
  onOpenChange,
}: ExpandableButtonProps) {
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [position, setPosition] = useState<Position | null>(null);

  const controlled = isOpen !== undefined;
  const open = controlled ? isOpen : internalOpen;

  const setOpen = (next: boolean) => {
    if (!controlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  const updatePosition = () => {
    const anchorEl = anchorRef.current;
    const panelEl = panelRef.current;
    if (!anchorEl || !panelEl) return;

    const anchorRect = anchorEl.getBoundingClientRect();
    const panelRect = panelEl.getBoundingClientRect();

    const nextPosition = resolveBestPosition(
      preferredPlacement,
      anchorRect,
      panelRect,
      offset
    );

    setPosition(nextPosition);
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, preferredPlacement, offset, children]);

  useEffect(() => {
    if (!open) return;

    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, preferredPlacement, offset, children]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        anchorRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {trigger}
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              left: position?.left ?? -9999,
              top: position?.top ?? -9999,
              maxWidth: `calc(100vw - ${VIEWPORT_MARGIN * 2}px)`,
              maxHeight: `calc(100vh - ${VIEWPORT_MARGIN * 2}px)`,
              overflow: "auto",
              zIndex: 1000,
            }}
          >
            {children}
          </div>,
          document.body
        )}
    </>
  );
}