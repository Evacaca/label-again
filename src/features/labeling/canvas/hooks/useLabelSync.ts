import { useEffect, useRef } from "react";
import type { Label, Polygon } from "@/components/layout/data/schema";

export interface UseLabelSyncProps {
  figures: Polygon[];
  label: Label | null;
  hiddenLabelIds?: Set<string>;
  polygons: Polygon[];
  selectedFigureId: string | null;
  onChange: (updatedLabel: Label) => void;
  onSelectFigure: (figure: Polygon | null) => void;
  onPolygonsChange: (updater: (prev: Polygon[]) => Polygon[]) => void;
  onSelectedFigureIdChange: (id: string | null) => void;
}

export interface UseLabelSyncReturn {
  // No return value - manages sync internally
}

export function useLabelSync({
  figures,
  label,
  hiddenLabelIds,
  polygons,
  selectedFigureId,
  onChange,
  onSelectFigure,
  onPolygonsChange,
  onSelectedFigureIdChange,
}: UseLabelSyncProps): UseLabelSyncReturn {
  // 用 ref 读 hiddenLabelIds/label，避免因对象引用变化反复触发导致多次切换 label 时循环
  const hiddenLabelIdsRef = useRef(hiddenLabelIds);
  hiddenLabelIdsRef.current = hiddenLabelIds;
  const labelRef = useRef(label);
  labelRef.current = label;

  // 从父级 figures 同步到本地 polygons（保存/加载、外部更新、toggle hidden 后可继续编辑）
  // 仅当结果与 prev 不同时才 setState（按 id 匹配比较，与顺序无关），避免多次切换 label 时循环更新
  useEffect(() => {
    onPolygonsChange((prev) => {
      // 由于 figures 现在包含了所有标签（包括隐藏的），同步变得非常简单：
      // 1. 优先采用 figures 中的最新数据（保证颜色、坐标同步）
      const nextPolygons = (figures ?? []).map((f) => {
        const p = prev.find((x) => x.id === f.id);
        // 仅在本地图形未完成（正在编辑中）时保留本地版本
        if (p && !p.finished) return p;
        return f;
      });

      // 2. 加上本地新建但尚未同步到父组件的图形
      const localOnly = prev.filter(
        (p) => !p.finished && !figures.some((f) => f.id === p.id)
      );

      const merged = [...nextPolygons, ...localOnly];

      // 3. 对比并更新
      if (prev.length !== merged.length) return merged;
      const nextById = new Map(merged.map((p) => [p.id, p]));
      const same =
        prev.every((p) => {
          const n = nextById.get(p.id);
          return (
            n &&
            p.finished === n.finished &&
            p.labelId === n.labelId &&
            p.color === n.color &&
            JSON.stringify(p.points) === JSON.stringify(n.points)
          );
        }) && merged.every((p) => nextById.has(p.id));

      if (same) return prev;
      return merged;
    });
  }, [figures, onPolygonsChange]);

  // polygons → label 同步通知父组件
  // 使用 ref 保存最新的 polygons，供 cleanup 调用，确保切换 label 时不丢失最后一次更改
  const polygonsRef = useRef(polygons);
  polygonsRef.current = polygons;
  useEffect(() => {
    const currentLabel = label;
    if (!currentLabel) return;

    const sync = (lbl: Label, polys: Polygon[]) => {
      const currentPolygons = polys.filter((p) => p.labelId === lbl.id);
      const updatedLabel = {
        ...lbl,
        polygons: currentPolygons,
      };
      if (JSON.stringify(updatedLabel) !== JSON.stringify(lbl)) {
        onChange(updatedLabel);
      }
    };

    // 正常同步
    sync(currentLabel, polygons);

    // Cleanup: 在 label 切换或卸载前，确保同步最后的状态
    return () => {
      sync(currentLabel, polygonsRef.current);
    };
  }, [polygons, label, onChange]);

  // 仅当「选中的 figure」变化时通知父组件；不依赖 onSelectFigure 引用，避免点击侧栏 label 时
  // 父组件重渲染导致 onSelectFigure 新引用 → 本 effect 误跑 → 用旧 selectedFigureId 把 label 改回去 → 循环
  const onSelectFigureRef = useRef(onSelectFigure);
  onSelectFigureRef.current = onSelectFigure;
  useEffect(() => {
    const figure = polygons.find((p) => p.id === selectedFigureId) ?? null;
    onSelectFigureRef.current(figure);
  }, [selectedFigureId, polygons]);

  // label 切换时选中当前 label 的 figure，并进入编辑状态（editing: selectedFigureId === polygon.id）
  // 仅依赖 label?.id 避免因 label 引用变化在多次切换时造成循环
  const prevLabelIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentLabel = labelRef.current;
    const currentLabelId = currentLabel?.id ?? null;
    if (prevLabelIdRef.current === currentLabelId) return;
    prevLabelIdRef.current = currentLabelId;

    if (!currentLabel) {
      onSelectedFigureIdChange(null);
      return;
    }
    const labelFigures = polygons.filter((p) => p.labelId === currentLabel.id);
    if (labelFigures.length === 0) {
      onSelectedFigureIdChange(null);
      return;
    }
    // 选中该 label 下最后一个（当前）figure，进入编辑状态
    const lastFigure = labelFigures[labelFigures.length - 1];
    onSelectedFigureIdChange(lastFigure.id);
  }, [label?.id, polygons, onSelectedFigureIdChange]);

  return {};
}
