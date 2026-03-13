import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import Konva from "konva";
import { Layer, Stage } from "react-konva";
import { PolygonFigure } from "./figure";
import type { Label, Polygon } from "@/components/layout/data/schema";
import { genId } from "./utils";
import type { Project } from "@/context/data/schema";
import type { CanvasStateRefValue } from "@/context/project-context";
import ImageLayer from "./image-layer";
import MatrixLayer, { type Bounds } from "./matrix-layer";

interface Point {
  x: number;
  y: number;
}
interface CanvasProps {
  project: Project;
  label: Label | null;
  figures: Polygon[];
  onChange: (updatedLabel: Label) => void;
  onSelectFigure: (figure: Polygon | null) => void;
  hiddenLabelIds?: Set<string>;
  canvasStateRef?: React.RefObject<CanvasStateRefValue | null>;
}

const Canvas: React.FC<CanvasProps> = ({
  project,
  label,
  figures,
  onChange,
  onSelectFigure,
  hiddenLabelIds,
  canvasStateRef,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<Konva.Stage>(null);

  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const [polygons, setPolygons] = useState<Polygon[]>(figures || []);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [tracePoint, setTracePoint] = useState<Point | null>(null);
  const [selectedFigureId, setSelectedFigureId] = useState<string | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [bounds, setBounds] = useState<Bounds | null>(null);

  // 按 label 隔离的 history，避免切换 label 后 undo/redo 影响错乱
  const [historyByLabel, setHistoryByLabel] = useState<
    Record<string, Polygon[][]>
  >({});
  const [redoStackByLabel, setRedoStackByLabel] = useState<
    Record<string, Polygon[][]>
  >({});

  const pushToHistory = useCallback(
    (currentPolygons: Polygon[]) => {
      if (!label) return;
      const labelId = label.id;
      const labelPolygons = currentPolygons.filter(
        (p) => p.labelId === labelId,
      );
      setHistoryByLabel((prev) => ({
        ...prev,
        [labelId]: [...(prev[labelId] ?? []), labelPolygons],
      }));
      setRedoStackByLabel((prev) => ({ ...prev, [labelId]: [] }));
    },
    [label],
  );

  const getSelectedFigure = useCallback((): Polygon | null => {
    return polygons.find((p) => p.id === selectedFigureId) ?? null;
  }, [polygons, selectedFigureId]);

  useImperativeHandle(
    canvasStateRef,
    () => ({
      getStageState: () => ({ scale, position }),
    }),
    [scale, position],
  );

  // 进入项目时恢复已保存的 stage 变换
  useEffect(() => {
    if (project?.stage) {
      setScale(project.stage.scale);
      setPosition(project.stage.position);
      setIsInitialized(true);
    }
  }, [project?.id, project?.stage]);

  // 从父级 figures 同步到本地 polygons（保存/加载、外部更新、toggle hidden 后可继续编辑）
  // 仅当结果与 prev 不同时才 setState（按 id 匹配比较，与顺序无关），避免多次切换 label 时循环更新
  useEffect(() => {
    setPolygons((prev) => {
      const unfinished =
        label?.id != null
          ? prev.find((p) => p.labelId === label.id && !p.finished)
          : null;
      const next = !unfinished
        ? figures ?? []
        : [...(figures ?? []).filter((p) => p.id !== unfinished.id), unfinished];
      if (prev.length !== next.length) return next;
      const nextById = new Map(next.map((p) => [p.id, p]));
      const same =
        prev.every((p) => {
          const n = nextById.get(p.id);
          return (
            n &&
            p.finished === n.finished &&
            p.labelId === n.labelId &&
            JSON.stringify(p.points) === JSON.stringify(n.points)
          );
        }) && next.every((p) => nextById.has(p.id));
      if (same) return prev;
      return next;
    });
  }, [figures, label?.id, hiddenLabelIds]);

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
  });

  // 用 ref 读 hiddenLabelIds/label，避免因对象引用变化反复触发导致多次切换 label 时循环
  const hiddenLabelIdsRef = React.useRef(hiddenLabelIds);
  hiddenLabelIdsRef.current = hiddenLabelIds;
  const labelRef = React.useRef(label);
  labelRef.current = label;
  useEffect(() => {
    const currentLabel = labelRef.current;
    if (!currentLabel) return;
    if (hiddenLabelIdsRef.current?.has(currentLabel.id)) return;
    const currentPolygons = polygons.filter((p) => p.labelId === currentLabel.id);
    const updatedLabel = {
      ...currentLabel,
      polygons: currentPolygons,
    };
    if (JSON.stringify(updatedLabel) !== JSON.stringify(currentLabel)) {
      onChange(updatedLabel);
    }
  }, [polygons, label?.id, onChange]);

  // 仅当「选中的 figure」变化时通知父组件；不依赖 onSelectFigure 引用，避免点击侧栏 label 时
  // 父组件重渲染导致 onSelectFigure 新引用 → 本 effect 误跑 → 用旧 selectedFigureId 把 label 改回去 → 循环
  const onSelectFigureRef = React.useRef(onSelectFigure);
  onSelectFigureRef.current = onSelectFigure;
  useEffect(() => {
    const figure =
      polygons.find((p) => p.id === selectedFigureId) ?? null;
    onSelectFigureRef.current(figure);
  }, [selectedFigureId, polygons]);

  // label 切换时选中当前 label 的 figure，并进入编辑状态（editing: selectedFigureId === polygon.id）
  // 仅依赖 label?.id 避免因 label 引用变化在多次切换时造成循环
  const prevLabelIdRef = React.useRef<string | null>(null);
  useEffect(() => {
    const currentLabel = labelRef.current;
    console.log("----- currentLabel -----", currentLabel);
    const currentLabelId = currentLabel?.id ?? null;
    if (prevLabelIdRef.current === currentLabelId) return;
    prevLabelIdRef.current = currentLabelId;

    if (!currentLabel) {
      setSelectedFigureId(null);
      return;
    }
    const labelFigures = polygons.filter((p) => p.labelId === currentLabel.id);
    if (labelFigures.length === 0) {
      setSelectedFigureId(null);
      return;
    }
    // 选中该 label 下最后一个（当前）figure，进入编辑状态
    const lastFigure = labelFigures[labelFigures.length - 1];
    setSelectedFigureId(lastFigure.id);
  }, [label?.id, polygons]);

  const handleClick = () => {
    const stage = stageRef.current;
    if (!stage) return;
    if (!label) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const newPoint = {
      x: (pointerPosition.x - position.x) / scale,
      y: (pointerPosition.y - position.y) / scale,
    };
    const currentPolygon = getSelectedFigure();
    console.log(
      "------ add new polygon? -----",
      !currentPolygon || currentPolygon.finished,
    );

    if (!currentPolygon) {
      pushToHistory(polygons);
      const newPolygon: Polygon = {
        labelId: label.id,
        id: genId(),
        points: [newPoint],
        finished: false,
        color: label.color,
      };
      setPolygons((prev) => [...prev, newPolygon]);
      setSelectedFigureId(newPolygon.id);
      return;
    }
    if (currentPolygon.finished) {
      setSelectedFigureId(null);
      return;
    }
    console.log("----- draw current polygon -----", currentPolygon);
    handleFigureChange("add", { point: newPoint, figure: currentPolygon! });
  };

  // 检查是否靠近起点
  const isNearFirstPoint = (point: Point, points: Point[]) => {
    if (points.length < 3) return false;
    const firstPoint = points[0];
    const distance = Math.sqrt(
      Math.pow(point.x - firstPoint.x, 2) + Math.pow(point.y - firstPoint.y, 2),
    );
    return distance < 10 / scale;
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    // 当拖拽的是 Stage 本身时才更新位置
    if (e.target !== stageRef.current) return;
    setPosition({ x: e.target.x(), y: e.target.y() });
  };

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
    [scale, position, size],
  );

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    const direction = e.evt.deltaY > 0 ? "out" : "in";
    handleZoom(direction, e);
  };

  const handleMouseMove = useMemo(() => {
    let lastUpdate = 0;
    const updateInterval = 1000 / 30; // 30fps

    return () => {
      if (!selectedFigureId) return;

      const now = Date.now();
      if (now - lastUpdate < updateInterval) return;
      lastUpdate = now;

      const stage = stageRef.current;
      if (!stage) return;

      const pointerPosition = stage.getPointerPosition();
      if (!pointerPosition) return;

      const point = {
        x: (pointerPosition.x - position.x) / scale,
        y: (pointerPosition.y - position.y) / scale,
      };

      setTracePoint(point);
    };
  }, [selectedFigureId, position, scale]);

  const handleFigureChange = (
    type: string,
    payload: { point?: Point; pos?: number; figure: Polygon },
  ) => {
    pushToHistory(polygons);
    switch (type) {
      case "move": {
        const { point, pos, figure } = payload;
        const newPoints = [...(figure.points || [])];
        newPoints[pos as number] = point as Point;
        setPolygons(
          polygons.map((p) =>
            p.id === figure.id ? { ...p, points: newPoints } : p,
          ),
        );
        break;
      }
      case "add": {
        const { point: newPoint, pos: insertPos, figure } = payload;
        if (insertPos !== undefined) {
          const pointsWithNew = [...figure.points];
          pointsWithNew.splice(insertPos, 0, newPoint as Point);
          setPolygons(
            polygons.map((p) =>
              p.id === figure.id ? { ...p, points: pointsWithNew } : p,
            ),
          );
        } else if (isNearFirstPoint(newPoint as Point, figure.points)) {
          handleFigureChange("end", { figure });
        } else {
          const pointsWithNew = [...figure.points, newPoint as Point];
          setPolygons(
            polygons.map((p) =>
              p.id === figure.id ? { ...p, points: pointsWithNew } : p,
            ),
          );
          setTracePoint(newPoint as Point);
        }
        break;
      }
      case "remove": {
        const { pos: removePos, figure } = payload;
        const remainingPoints =
          figure?.points.filter((_, i) => i !== removePos) || [];
        setPolygons(
          polygons.map((p) =>
            p.id === figure.id ? { ...p, points: remainingPoints } : p,
          ),
        );
        break;
      }
      case "end": {
        const { figure } = payload;
        figure.finished = true;
        setPolygons((prev) =>
          prev.map((p) =>
            p.id === figure.id ? { ...figure, finished: true } : p,
          ),
        );
        setTracePoint(null);
        setSelectedFigureId(null);
        break;
      }
      default:
        throw new Error("unknown event type " + type);
    }
  };

  const currentDrawingFigure = polygons.find(
    (p) => p.id === selectedFigureId && !p.finished,
  );
  const isDrawing = !!currentDrawingFigure;

  const deleteSelectedFigure = useCallback(() => {
    if (!selectedFigureId) return;
    const figure = getSelectedFigure();
    if (!figure || !figure.finished) return;
    pushToHistory(polygons);
    setPolygons(polygons.filter((p) => p.id !== selectedFigureId));
    setSelectedFigureId(null);
  }, [selectedFigureId, polygons, getSelectedFigure, pushToHistory]);

  const undo = useCallback(() => {
    if (!label) return;
    const labelId = label.id;
    const history = historyByLabel[labelId] ?? [];
    if (history.length === 0) return;

    const previousLabelPolygons = history[history.length - 1];
    setHistoryByLabel((prev) => ({
      ...prev,
      [labelId]: (prev[labelId] ?? []).slice(0, -1),
    }));
    setRedoStackByLabel((prev) => ({
      ...prev,
      [labelId]: [
        polygons.filter((p) => p.labelId === labelId),
        ...(prev[labelId] ?? []),
      ],
    }));
    const otherPolygons = polygons.filter((p) => p.labelId !== labelId);
    setPolygons([...otherPolygons, ...previousLabelPolygons]);
    // 撤销后若存在未完成的 polygon，自动进入编辑状态，便于继续基于该 figure 绘制/显示 guides
    const unfinished = previousLabelPolygons.find((p) => !p.finished) ?? null;
    setSelectedFigureId(unfinished?.id ?? null);
    setTracePoint(null);
  }, [label, historyByLabel, polygons]);

  const redo = useCallback(() => {
    if (!label) return;
    const labelId = label.id;
    const redoStack = redoStackByLabel[labelId] ?? [];
    if (redoStack.length === 0) return;

    const nextLabelPolygons = redoStack[0];
    setRedoStackByLabel((prev) => ({
      ...prev,
      [labelId]: (prev[labelId] ?? []).slice(1),
    }));
    setHistoryByLabel((prev) => ({
      ...prev,
      [labelId]: [
        ...(prev[labelId] ?? []),
        polygons.filter((p) => p.labelId === labelId),
      ],
    }));
    const otherPolygons = polygons.filter((p) => p.labelId !== labelId);
    setPolygons([...otherPolygons, ...nextLabelPolygons]);
    const unfinished = nextLabelPolygons.find((p) => !p.finished) ?? null;
    setSelectedFigureId(unfinished?.id ?? null);
    setTracePoint(null);
  }, [label, redoStackByLabel, polygons]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key == "Delete" || e.key == "Backspace") {
        e.preventDefault();
        deleteSelectedFigure();
      }
      if (e.key == "+" || e.key == "=") {
        e.preventDefault();
        handleZoom("in");
      }
      if (e.key == "-" || e.key == "_") {
        e.preventDefault();
        handleZoom("out");
      }
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      if (ctrlOrCmd && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if (ctrlOrCmd && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleteSelectedFigure, handleZoom, undo, redo]);

  return (
    <div
      ref={containerRef}
      style={{
        cursor: selectedFigureId ? "crosshair" : "grab",
        width: "100%",
        height: "100%",
      }}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scale={{ x: scale, y: scale }}
        draggable
        onClick={handleClick}
        onDragMove={handleDragMove}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        x={position.x}
        y={position.y}
      >
        {project.image && (
          <ImageLayer
            imageFile={project.image}
            initialTransform={project.imageTransform}
          />
        )}
        <MatrixLayer
          matrixData={project.matrixData}
          matrixColor={project.matrixColor}
          onBoundsChange={setBounds}
          scale={scale}
        />

        <Layer>
          {polygons.map((polygon) => (
            <PolygonFigure
              key={polygon.id}
              figure={polygon}
              options={{
                newPoint:
                  polygon.id === selectedFigureId
                    ? tracePoint || undefined
                    : undefined,
                editing: selectedFigureId === polygon.id,
                finished: polygon.finished,
                sketch: true,
                color: polygon.color,
                vertexColor: polygon.color,
                interactive: !isDrawing || polygon.id === selectedFigureId,
                scale,
                onSelect: () => {
                  if (!isDrawing) {
                    setSelectedFigureId(polygon.id);
                  }
                },
                onChange: handleFigureChange,
              }}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;
