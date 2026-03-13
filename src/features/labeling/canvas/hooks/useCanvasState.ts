import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import Konva from "konva";
import type { Project } from "@/context/data/schema";
import type { CanvasStateRefValue } from "@/context/project-context";
import type { Bounds } from "../../matrix-layer";
import type { Point } from "../types";

export interface UseCanvasStateProps {
  project: Project;
  canvasStateRef?: React.RefObject<CanvasStateRefValue | null>;
  onBoundsChange: (bounds: Bounds | null) => void;
}

export interface UseCanvasStateReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  stageRef: React.RefObject<Konva.Stage | null>;
  setStageRef: (ref: Konva.Stage | null) => void;
  setBounds: (bounds: Bounds | null) => void;
  size: { width: number; height: number };
  scale: number;
  position: Point;
  handleDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
  handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  handleZoom: (direction: "in" | "out", e?: Konva.KonvaEventObject<WheelEvent>) => void;
}

export function useCanvasState({
  project,
  canvasStateRef,
  onBoundsChange,
}: UseCanvasStateProps): UseCanvasStateReturn {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [stageRefInternal, setStageRefInternal] = useState<Konva.Stage | null>(null);
  const stageRef = useMemo(() => ({ current: stageRefInternal }), [stageRefInternal]);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [bounds, setBounds] = useState<Bounds | null>(null);

  // setBounds is used by the MatrixLayer to communicate bounds to this component
  // We keep it here even though it's not directly used in the hook logic
  void setBounds;

  const handleZoom = useCallback(
    (direction: "in" | "out", e?: Konva.KonvaEventObject<WheelEvent>) => {
      e?.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition() || {
        x: size.width / 2,
        y: size.height / 2,
      };

      const mousePointTo = {
        x: (pointer.x - position.x) / scale,
        y: (pointer.y - position.y) / scale,
      };

      const scaleBy = 1.1;
      const newScale = direction == "out" ? scale / scaleBy : scale * scaleBy;

      setScale(newScale);
      setPosition({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [scale, position, size, stageRef],
  );

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      // 当拖拽的是 Stage 本身时才更新位置
      if (e.target !== stageRef.current) return;
      setPosition({ x: e.target.x(), y: e.target.y() });
    },
    [stageRef],
  );

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      const direction = e.evt.deltaY > 0 ? "out" : "in";
      handleZoom(direction, e);
    },
    [handleZoom],
  );

  // Expose canvas state via ref
  React.useImperativeHandle(
    canvasStateRef,
    () => ({
      getStageState: () => ({ scale, position }),
    }),
    [scale, position],
  );

  // 进入项目时恢复已保存的 stage 变换
  React.useEffect(() => {
    if (project?.stage) {
      setScale(project.stage.scale);
      setPosition(project.stage.position);
      setIsInitialized(true);
    }
  }, [project?.id, project?.stage]);

  // Notify parent of bounds changes
  React.useEffect(() => {
    if (bounds) {
      onBoundsChange(bounds);
    }
  }, [bounds, onBoundsChange]);

  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize((prev) =>
          prev.width === width && prev.height === height ? prev : { width, height }
        );

        if (!isInitialized && bounds && !project?.stage) {
          // 无已保存的 stage 时，计算初始缩放比例使内容适合视图
          const contentAspect = bounds.width / bounds.height;
          const containerAspect = width / height;
          let initialScale = 1;

          if (contentAspect > containerAspect) {
            initialScale = width / bounds.width;
          } else {
            initialScale = height / bounds.height;
          }
          initialScale = Math.min(1, initialScale * 0.8);

          setScale(initialScale);
          console.log("----- initialScale -----", initialScale);
          console.log("----- bounds -----", bounds);
          // 计算居中位置
          const contentCenterX = bounds.minX + bounds.width / 2;
          const contentCenterY = bounds.minY + bounds.height / 2;

          setPosition({
            x: width / 2 - contentCenterX * initialScale,
            y: height / 2 - contentCenterY * initialScale,
          });

          setIsInitialized(true);
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [isInitialized, bounds, project?.stage, containerRef]);

  return {
    containerRef,
    stageRef,
    setStageRef: setStageRefInternal,
    setBounds,
    size,
    scale,
    position,
    handleDragMove,
    handleWheel,
    handleZoom,
  };
}
