import { useCallback, useState } from "react";
import type { Label, Polygon } from "@/components/layout/data/schema";

export interface UseCanvasHistoryProps {
  label: Label | null;
  polygons: Polygon[];
  onPolygonsChange: (updater: React.SetStateAction<Polygon[]>) => void;
  onSelectedFigureIdChange: (id: string | null) => void;
  onTracePointChange: (point: null) => void;
}

export interface UseCanvasHistoryReturn {
  pushToHistory: (currentPolygons: Polygon[]) => void;
  undo: () => void;
  redo: () => void;
}

export function useCanvasHistory({
  label,
  polygons,
  onPolygonsChange,
  onSelectedFigureIdChange,
  onTracePointChange,
}: UseCanvasHistoryProps): UseCanvasHistoryReturn {
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
    onPolygonsChange([...otherPolygons, ...previousLabelPolygons]);
    // 撤销后若存在未完成的 polygon，自动进入编辑状态，便于继续基于该 figure 绘制/显示 guides
    const unfinished = previousLabelPolygons.find((p) => !p.finished) ?? null;
    onSelectedFigureIdChange(unfinished?.id ?? null);
    onTracePointChange(null);
  }, [label, historyByLabel, polygons, onPolygonsChange, onSelectedFigureIdChange, onTracePointChange]);

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
    onPolygonsChange([...otherPolygons, ...nextLabelPolygons]);
    const unfinished = nextLabelPolygons.find((p) => !p.finished) ?? null;
    onSelectedFigureIdChange(unfinished?.id ?? null);
    onTracePointChange(null);
  }, [label, redoStackByLabel, polygons, onPolygonsChange, onSelectedFigureIdChange, onTracePointChange]);

  return {
    pushToHistory,
    undo,
    redo,
  };
}
