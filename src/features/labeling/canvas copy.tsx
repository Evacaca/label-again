import React, { useState } from "react";
import Konva from "konva";
import { Circle, Layer, Line, Stage } from "react-konva";

interface Point {
  x: number;
  y: number;
}
interface CanvasProps {
  width: number;
  height: number;
}
const Canvas: React.FC<CanvasProps> = ({ width, height }) => {
  const stageRef = React.useRef<Konva.Stage>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [tracePoint, setTracePoint] = useState<Point | null>(null);
  const [isClosed, setIsClosed] = useState(false);

  const isNearOriginPoint = (point: Point) => {
    if (points.length < 3) return false;
    const originPoint = points[0];
    const distance = Math.sqrt((point.x - originPoint.x) ** 2 + (point.y - originPoint.y) ** 2);
    return distance < 10 / scale;
  }

  const handleClick = () => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const newPoint = {
      x: (pointerPosition.x - position.x) / scale,
      y: (pointerPosition.y - position.y) / scale,
    }
    if (isNearOriginPoint(newPoint)) {
      setIsClosed(true);
      setPoints([...points, points[0]]);
    } else {
      setPoints([...points, newPoint]);
      setTracePoint(newPoint)
      setIsClosed(false)
    }
  }

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
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
    if (isNearOriginPoint(point)) {
      setTracePoint(points[0])
    } else {
      setTracePoint(point)
    }
  }

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      scale={{ x: scale, y: scale }}
      draggable
      onClick={handleClick}
      onDragMove={handleDragMove}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      x={position.x}
      y={position.y}>
      <Layer>
        {points.length > 1 && (
          <Line
            points={points.flatMap(point => [point.x, point.y])}
            closed={isClosed}
            fill={isClosed ? "rgba(180, 19, 236, 0.7)" : undefined}
            fillRule="evenodd"
            stroke="#B413EC"
            strokeWidth={3} />
        )}
        {points.length > 0 && tracePoint && !isClosed && (
          <Line
            points={[
              points[points.length - 1].x,
              points[points.length - 1].y,
              tracePoint.x,
              tracePoint.y
            ]}
            stroke="#B413EC"
            strokeWidth={2}
            dash={[5, 5]} />
        )}
        {points.map((point, i) => (
          <Circle key={i} x={point.x} y={point.y} radius={5} fill="#B413EC" />
        ))}
      </Layer>
    </Stage>
  )
}

export default Canvas;