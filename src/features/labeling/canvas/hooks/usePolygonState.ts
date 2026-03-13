import React, { useState, useMemo } from "react";
import type { Label, Polygon } from "@/components/layout/data/schema";
import type { Point } from "../types";

export interface UsePolygonStateProps {
  figures: Polygon[];
  label: Label | null;
}

export interface UsePolygonStateReturn {
  polygons: Polygon[];
  tracePoint: Point | null;
  selectedFigureId: string | null;
  setPolygons: React.Dispatch<React.SetStateAction<Polygon[]>>;
  setTracePoint: (point: Point | null) => void;
  setSelectedFigureId: (id: string | null) => void;
  getSelectedFigure: () => Polygon | null;
  currentDrawingFigure: Polygon | null;
  isDrawing: boolean;
}

export function usePolygonState({
  figures,
}: UsePolygonStateProps): UsePolygonStateReturn {
  const [polygons, setPolygons] = useState<Polygon[]>(figures || []);
  const [tracePoint, setTracePoint] = useState<Point | null>(null);
  const [selectedFigureId, setSelectedFigureId] = useState<string | null>(null);

  const getSelectedFigure = React.useCallback((): Polygon | null => {
    return polygons.find((p) => p.id === selectedFigureId) ?? null;
  }, [polygons, selectedFigureId]);

  const currentDrawingFigure = useMemo(
    () => polygons.find((p) => p.id === selectedFigureId && !p.finished) ?? null,
    [polygons, selectedFigureId],
  );

  const isDrawing = !!currentDrawingFigure;

  return {
    polygons,
    tracePoint,
    selectedFigureId,
    setPolygons,
    setTracePoint,
    setSelectedFigureId,
    getSelectedFigure,
    currentDrawingFigure,
    isDrawing,
  };
}
