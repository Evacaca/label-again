import React, { useEffect, useLayoutEffect, useState } from "react";
import Konva from "konva";
import { Circle, Layer, Stage } from "react-konva";
import { PolygonFigure } from "./figure";
import type { Label, Polygon } from "@/components/layout/data/schema";
import { genId } from "./utils";
import type { Project } from "@/context/data/schema";
import ImageLoader from "./image-loader";

interface Point {
  x: number;
  y: number;
}
interface CanvasProps {
  project: Project;
  label: Label | null;
  figures: Polygon[];
  onChange: (updatedLabel: Label) => void;
  onSelectFigure: (figure: Polygon) => void;
}
const Canvas: React.FC<CanvasProps> = ({ project, label, figures, onChange, onSelectFigure }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  const stageRef = React.useRef<Konva.Stage>(null);
  const [polygons, setPolygons] = useState<Polygon[]>(figures || []);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [tracePoint, setTracePoint] = useState<Point | null>(null);
  const [selectedFigureId, setSelectedFigureId] = useState<string | null>(null);
  const matrixData = project.matrixData;

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
    if (!label) return;
    const currentPolygons = polygons.filter(p => p.labelId === label.id);
    const updatedLabel = {
      ...label,
      polygons: currentPolygons,
    };

    if (JSON.stringify(updatedLabel) !== JSON.stringify(label)) {
      onChange(updatedLabel);
    }
  }, [polygons]);

  useEffect(() => {
    onSelectFigure(getSelectedFigure());
  }, [selectedFigureId])

  const handleClick = () => {
    if (!label) return;
    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const newPoint = {
      x: (pointerPosition.x - position.x) / scale,
      y: (pointerPosition.y - position.y) / scale,
    };
    const currentPolygon = getSelectedFigure();
    console.log('------ add new polygon? -----', !currentPolygon || currentPolygon.finished);
    if (!currentPolygon || currentPolygon.finished) {
      const newPolygon: Polygon = {
        labelId: label.id,
        id: genId(),
        points: [newPoint],
        finished: false,
        color: label.color
      }
      setPolygons(prev => [...prev, newPolygon]);
      setSelectedFigureId(newPolygon.id);
      return;
    }
    console.log('----- draw current polygon -----', currentPolygon);
    handleFigureChange('add', { point: newPoint, figure: currentPolygon! })
  }

  // 检查是否靠近起点
  const isNearFirstPoint = (point: Point, points: Point[]) => {
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
    if (e.target !== stageRef.current) return;
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

  const handleFigureChange = (type: string, payload: { point?: Point, pos?: number, figure: Polygon }) => {
    switch (type) {
      case 'move':
        {
          const { point, pos, figure } = payload;
          const newPoints = [...figure.points || []];
          newPoints[pos as number] = point as Point;
          setPolygons(polygons.map(p => p.id === figure.id ? { ...p, points: newPoints } : p));
          break;
        }
      case 'add':
        {
          const { point: newPoint, pos: insertPos, figure } = payload;
          if (insertPos !== undefined) {
            const pointsWithNew = [...figure.points];
            pointsWithNew.splice(insertPos, 0, newPoint as Point);
            setPolygons(polygons.map(p => p.id === figure.id ? { ...p, points: pointsWithNew } : p));
          }
          else if (isNearFirstPoint(newPoint as Point, figure.points)) {
            handleFigureChange('end', { figure });
          } else {
            const pointsWithNew = [...figure.points, newPoint as Point];
            setPolygons(polygons.map(p => p.id === figure.id ? { ...p, points: pointsWithNew } : p));
            setTracePoint(newPoint as Point);
          }
          break;
        }
      case 'remove':
        {
          const { pos: removePos, figure } = payload;
          const remainingPoints = figure?.points.filter((_, i) => i !== removePos) || [];
          setPolygons(polygons.map(p => p.id === figure.id ? { ...p, points: remainingPoints } : p));
          break;
        }
      case 'end':
        {
          const { figure } = payload;
          figure.finished = true;
          setPolygons(prev => prev.map(p => p.id === figure.id ? { ...figure, finished: true } : p));
          setTracePoint(null);
          setSelectedFigureId(null);
          break;
        }
      default:
        throw new Error('unknown event type ' + type);
    }
  }

  const getSelectedFigure = () => {
    return polygons.find(p => p.id === selectedFigureId) as Polygon;
  }

  return (
    <div ref={containerRef}
      style={{
        cursor: selectedFigureId ? 'crosshair' : 'grab',
        width: '100%', height: '100%'
      }}>
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
        {
          project.image &&
          <ImageLoader
            imageFile={project.image}
          />
        }
        <Layer>
          {
            matrixData.map(([x, y], i) => (
              <Circle
                key={`matrix-${i}`}
                x={x}
                y={y}
                radius={7}
                fill={project.matrixColor}
              />
            ))
          }
        </Layer>

        <Layer>
          {
            figures.map(polygon => (
              <PolygonFigure
                key={polygon.id}
                figure={polygon}
                options={{
                  newPoint: polygon.id === selectedFigureId ? tracePoint || undefined : undefined,
                  editing: selectedFigureId === polygon.id,
                  finished: polygon.finished,
                  sketch: true,
                  color: polygon.color,
                  vertexColor: polygon.color,
                  interactive: true,
                  onSelect: () => setSelectedFigureId(polygon.id),
                  onChange: handleFigureChange
                }}
              />
            ))
          }
        </Layer>

      </Stage>
    </div>
  )
}

export default Canvas;