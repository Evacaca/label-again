import React, { useEffect, useLayoutEffect, useState } from "react";
import Konva from "konva";
import { Layer, Stage } from "react-konva";
import { PolygonFigure } from "./figure";
import type { Label } from "@/components/layout/data/schema";

interface Point {
  x: number;
  y: number;
}
interface CanvasProps {
  label: Label;
  onChange: (updatedLabel: Label) => void;
}
const Canvas: React.FC<CanvasProps> = ({ label, onChange }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  const stageRef = React.useRef<Konva.Stage>(null);
  const [points, setPoints] = useState<Point[]>(label.polygon || []);
  const [scale, setScale] = useState(label.scale || 1);
  const [position, setPosition] = useState<Point>(label.position || { x: 0, y: 0 });
  const [tracePoint, setTracePoint] = useState<Point | null>(null);
  const [isClosed, setIsClosed] = useState(label.finished || false);
  const [selectedFigureId, setSelectedFigureId] = useState<string | null>(null);
  const [skipClick, setSkipClick] = useState(false);

  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const updatedLabel = {
      ...label,
      polygon: points,
      finished: isClosed,
      scale,
      position
    };

    if (JSON.stringify(updatedLabel) !== JSON.stringify(label)) {
      onChange(updatedLabel);
    }
  }, [points, isClosed, scale, position]);

  const handleClick = () => {
    if (skipClick) {
      setSkipClick(false);
      return;
    }

    if (isClosed) {
      setSelectedFigureId(null);
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const newPoint = {
      x: (pointerPosition.x - position.x) / scale,
      y: (pointerPosition.y - position.y) / scale,
    };

    if (isNearFirstPoint(newPoint)) {
      setIsClosed(true);
      setTracePoint(null);
    } else {
      setPoints([...points, newPoint]);
      setTracePoint(newPoint);
    }
  }

  // 检查是否靠近起点
  const isNearFirstPoint = (point: Point) => {
    if (points.length < 3) return false;
    const firstPoint = points[0];
    const distance = Math.sqrt(
      Math.pow(point.x - firstPoint.x, 2) +
      Math.pow(point.y - firstPoint.y, 2)
    );
    return distance < 10 / scale;
  }

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    // 当拖拽的是 Stage 本身时才更新位置
    if (skipClick || e.target !== stageRef.current) return;
    setPosition({ x: e.target.x(), y: e.target.y() });
  }

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const oldScale = scale;
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    // 缩放比例
    const scaleBy = 1.1;
    // deltaY > 0 缩小  < 0 放大
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }

  const handleMouseMove = () => {
    if (skipClick) return;

    if (isClosed) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const point = {
      x: (pointerPosition.x - position.x) / scale,
      y: (pointerPosition.y - position.y) / scale,
    };

    setTracePoint(point);
  }

  const handleFigureChange = (type: string, payload: { point?: Point, pos?: number }) => {
    switch (type) {
      case 'move':
        {
          const { point, pos } = payload;
          const newPoints = [...points];
          newPoints[pos as number] = point as Point;
          setPoints(newPoints);
          break;
        }
      case 'add':
        {
          const { point: newPoint, pos: insertPos } = payload;
          const pointsWithNew = [...points];
          pointsWithNew.splice(insertPos as number, 0, newPoint as Point);
          setPoints(pointsWithNew);
          break;
        }
      case 'remove':
        {
          const { pos: removePos } = payload;
          const remainingPoints = points.filter((_, i) => i !== removePos);
          setPoints(remainingPoints);
          break;
        }
      case 'end':
        setIsClosed(true);
        setSkipClick(false);
        break;
    }
  }

  const skipNextClick = () => {
    // 用于防止事件冒泡
    setSkipClick(true);
  }

  return (

    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
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
        y={position.y}>
        <Layer>
          <PolygonFigure
            figure={{
              id: "polygon-1",
              points: points
            }}
            options={{
              newPoint: tracePoint || undefined,
              editing: selectedFigureId === "polygon-1",
              finished: isClosed,
              sketch: false,
              color: "#B413EC",
              vertexColor: "#B413EC",
              interactive: true,
              onSelect: () => setSelectedFigureId("polygon-1"),
              onChange: handleFigureChange
            }}
            skipNextClick={skipNextClick}
          />
        </Layer>
      </Stage>
    </div>
  )
}

export default Canvas;