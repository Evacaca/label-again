import { useLabels } from "@/components/layout/context/labels-context";
import Canvas from "./canvas";
import { useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Polygon } from "@/components/layout/data/schema";
import { useProjects } from "@/context/project-context";

export default function Labeling() {
  const { getProject } = useProjects();
  const { labelId } = useParams({ from: '/(label)/$labelId' })
  const project = getProject(labelId);
  const { currentLabel, updateLabel, labels, setCurrentLabel, hiddenLabelIds } = useLabels();

  const [figures, setFigures] = useState<Polygon[]>([])

  const getCurrentLabel = (figure: Polygon) => {
    if (!figure) {
      setCurrentLabel(null);
      return;
    }
    const label = labels.find(label => label.id === figure.labelId);
    if (!label) return;
    setCurrentLabel(label);
  }

  useEffect(() => {
    const newFigures: Polygon[] = [];
    labels.forEach(label => {
      if (hiddenLabelIds.has(label.id)) return;
      label.polygons?.forEach(polygon => {
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
    <Canvas {...{ project, label: currentLabel, figures, onChange: updateLabel, onSelectFigure: getCurrentLabel }} />
  )
}