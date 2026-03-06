import { useLabels } from "@/components/layout/context/labels-context";
import Canvas from "./canvas";
import { useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import type { Polygon } from "@/components/layout/data/schema";
import { useProjects } from "@/context/project-context";

export default function Labeling() {
  const { getProject, canvasStateRef } = useProjects();
  const { labelId } = useParams({ from: "/(label)/$labelId" });
  const project = getProject(labelId);
  const {
    currentLabel,
    updateLabel,
    labels,
    setCurrentLabel,
    setLabels,
    hiddenLabelIds,
  } = useLabels();

  // 进入项目时恢复已保存的 labels
  useEffect(() => {
    if (!project?.id) return;
    if (project.labels != null && Array.isArray(project.labels)) {
      setLabels(project.labels);
    }
  }, [project?.id, project?.labels, setLabels]);

  const [figures, setFigures] = useState<Polygon[]>([]);

  const getCurrentLabel = useCallback(
    (figure: Polygon | null) => {
      if (!figure) {
        return;
      }
      if (figure.labelId === currentLabel?.id) return;
      const label = labels.find((label) => label.id === figure.labelId);
      if (!label) return;
      setCurrentLabel(label);
    },
    [labels, setCurrentLabel, currentLabel?.id],
  );

  useEffect(() => {
    const newFigures: Polygon[] = [];
    labels.forEach((label) => {
      if (hiddenLabelIds.has(label.id)) return;
      label.polygons?.forEach((polygon) => {
        newFigures.push({
          ...polygon,
          labelId: label.id,
          id: polygon.id,
          color: label.color,
        });
      });
    });
    setFigures(newFigures);
  }, [labels, hiddenLabelIds]);
  if (!project) return <div>Project not found</div>;
  return (
    <Canvas
      project={project}
      label={currentLabel}
      figures={figures}
      onChange={updateLabel}
      onSelectFigure={getCurrentLabel}
      hiddenLabelIds={hiddenLabelIds}
      canvasStateRef={canvasStateRef}
    />
  );
}
