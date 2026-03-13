import React from "react";
import Konva from "konva";
import { Layer, Stage } from "react-konva";
import type { Project } from "@/context/data/schema";
import type { Point } from "../types";
import type { Polygon } from "@/components/layout/data/schema";
import ImageLayer from "../../image-layer";
import MatrixLayer from "../../matrix-layer";
import { PolygonFigure } from "../../figure";

interface CanvasStageProps {
  project: Project;
  size: { width: number; height: number };
  scale: number;
  position: Point;
  polygons: Polygon[];
  hiddenLabelIds?: Set<string>;
  selectedFigureId: string | null;
  tracePoint: Point | null;
  isDrawing: boolean;
  onStageRef: (ref: Konva.Stage | null) => void;
  onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  onMouseMove: () => void;
  onClick: () => void;
  onFigureChange: (type: string, payload: { point?: Point; pos?: number; figure: Polygon }) => void;
  onBoundsChange: (bounds: import("../../matrix-layer").Bounds | null) => void;
  onSelectedFigureIdChange: (id: string | null) => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  project,
  size,
  scale,
  position,
  polygons,
  hiddenLabelIds,
  selectedFigureId,
  tracePoint,
  isDrawing,
  onStageRef,
  onDragMove,
  onWheel,
  onMouseMove,
  onClick,
  onFigureChange,
  onBoundsChange,
  onSelectedFigureIdChange,
}) => {
  return (
    <Stage
      ref={onStageRef}
      width={size.width}
      height={size.height}
      scale={{ x: scale, y: scale }}
      draggable
      onClick={onClick}
      onDragMove={onDragMove}
      onWheel={onWheel}
      onMouseMove={onMouseMove}
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
        onBoundsChange={onBoundsChange}
        scale={scale}
      />

      <Layer>
        {polygons
          .filter((p) => !hiddenLabelIds?.has(p.labelId))
          .map((polygon) => (
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
                  onSelectedFigureIdChange(polygon.id);
                }
              },
              onChange: onFigureChange,
            }}
          />
        ))}
      </Layer>
    </Stage>
  );
};
