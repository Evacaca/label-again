import React, { useEffect, useMemo, useCallback } from "react";
import Konva from "konva";
import type { Label, Polygon } from "@/components/layout/data/schema";
import type { Point } from "../types";
import { genId } from "../../utils";

export interface UseCanvasEventsProps {
  stageRef: React.RefObject<Konva.Stage>;
  label: Label | null;
  scale: number;
  position: Point;
  polygons: Polygon[];
  selectedFigureId: string | null;
  tracePoint: Point | null;
  isDrawing: boolean;
  onPolygonsChange: (updater: React.SetStateAction<Polygon[]>) => void;
  onTracePointChange: (point: Point | null) => void;
  onSelectedFigureIdChange: (id: string | null) => void;
  pushToHistory: (polygons: Polygon[]) => void;
  getSelectedFigure: () => Polygon | null;
  handleZoom: (direction: "in" | "out") => void;
}

export interface UseCanvasEventsReturn {
  handleClick: () => void;
  handleMouseMove: () => void;
  handleFigureChange: (type: string, payload: { point?: Point; pos?: number; figure: Polygon }) => void;
  isNearFirstPoint: (point: Point, points: Point[]) => boolean;
  deleteSelectedFigure: () => void;
}

export function useCanvasEvents({
  stageRef,
  label,
  scale,
  position,
  polygons,
  selectedFigureId,
  onPolygonsChange,
  onTracePointChange,
  onSelectedFigureIdChange,
  pushToHistory,
  getSelectedFigure,
  handleZoom,
}: UseCanvasEventsProps): UseCanvasEventsReturn {
  // 检查是否靠近起点
  const isNearFirstPoint = useCallback((point: Point, points: Point[]) => {
    if (points.length < 3) return false;
    const firstPoint = points[0];
    const distance = Math.sqrt(
      Math.pow(point.x - firstPoint.x, 2) + Math.pow(point.y - firstPoint.y, 2),
    );
    return distance < 10 / scale;
  }, [scale]);

  const handleFigureChange = useCallback((
    type: string,
    payload: { point?: Point; pos?: number; figure: Polygon },
  ) => {
    pushToHistory(polygons);
    switch (type) {
      case "move": {
        const { point, pos, figure } = payload;
        const newPoints = [...(figure.points || [])];
        newPoints[pos as number] = point as Point;
        onPolygonsChange(
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
          onPolygonsChange(
            polygons.map((p) =>
              p.id === figure.id ? { ...p, points: pointsWithNew } : p,
            ),
          );
        } else if (isNearFirstPoint(newPoint as Point, figure.points)) {
          handleFigureChange("end", { figure });
        } else {
          const pointsWithNew = [...figure.points, newPoint as Point];
          onPolygonsChange(
            polygons.map((p) =>
              p.id === figure.id ? { ...p, points: pointsWithNew } : p,
            ),
          );
          onTracePointChange(newPoint as Point);
        }
        break;
      }
      case "remove": {
        const { pos: removePos, figure } = payload;
        const remainingPoints =
          figure?.points.filter((_, i) => i !== removePos) || [];
        onPolygonsChange(
          polygons.map((p) =>
            p.id === figure.id ? { ...p, points: remainingPoints } : p,
          ),
        );
        break;
      }
      case "end": {
        const { figure } = payload;
        figure.finished = true;

        onPolygonsChange((prev) =>
          prev.map((p) =>
            p.id === figure.id ? { ...figure, finished: true } : p,
          ),
        );
        onTracePointChange(null);
        onSelectedFigureIdChange(null);
        break;
      }
      default:
        throw new Error("unknown event type " + type);
    }
  }, [polygons, pushToHistory, onPolygonsChange, onTracePointChange, onSelectedFigureIdChange, isNearFirstPoint]);

  const handleClick = useCallback(() => {
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
      onPolygonsChange((prev) => [...prev, newPolygon]);
      onSelectedFigureIdChange(newPolygon.id);
      return;
    }
    if (currentPolygon.finished) {
      onSelectedFigureIdChange(null);
      return;
    }
    console.log("----- draw current polygon -----", currentPolygon);
    handleFigureChange("add", { point: newPoint, figure: currentPolygon! });
  }, [
    stageRef,
    label,
    position,
    scale,
    polygons,
    pushToHistory,
    onPolygonsChange,
    onSelectedFigureIdChange,
    getSelectedFigure,
    handleFigureChange,
  ]);

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

      onTracePointChange(point);
    };
  }, [selectedFigureId, position, scale, stageRef, onTracePointChange]);

  const deleteSelectedFigure = useCallback(() => {
    if (!selectedFigureId) return;
    const figure = getSelectedFigure();
    if (!figure || !figure.finished) return;
    pushToHistory(polygons);
    onPolygonsChange(polygons.filter((p) => p.id !== selectedFigureId));
    onSelectedFigureIdChange(null);
  }, [selectedFigureId, polygons, getSelectedFigure, pushToHistory, onPolygonsChange, onSelectedFigureIdChange]);

  // Keyboard event handlers
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
        // This will be handled by the parent component's undo/redo
        window.dispatchEvent(new CustomEvent('canvas-undo', { detail: { shiftKey: e.shiftKey } }));
      }
      if (ctrlOrCmd && e.key === "y") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('canvas-redo'));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleteSelectedFigure, handleZoom]);

  return {
    handleClick,
    handleMouseMove,
    handleFigureChange,
    isNearFirstPoint,
    deleteSelectedFigure,
  };
}
