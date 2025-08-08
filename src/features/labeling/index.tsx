import { useLabels } from "@/components/layout/context/labels-context";
import Canvas from "./canvas";
import { useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Polygon } from "@/components/layout/data/schema";

export default function Labeling() {
  const { currentLabel, updateLabel, labels, setCurrentLabel } = useLabels();
  const { labelId } = useParams({ from: '/(label)/$labelId' })
  const project = JSON.parse(localStorage.getItem(labelId) || '{}')
  const [figures, setFigures] = useState<Polygon[]>([])

  const getCurrentLabel = (figure: Polygon) => {
    const label = labels.find(label => label.id === figure.labelId);
    if (!label) return;
    setCurrentLabel(label);
  }

  useEffect(() => {
    const newFigures: Polygon[] = [];
    labels.forEach(label => {
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
  }, [labels]);

  if (!currentLabel) return <div className="p-4">
    <h2 className='text-2xl font-bold tracking-tight'>Hello!</h2>
    <p className='text-muted-foreground'>
      标签无效，请先创建标签
    </p>
  </div>

  return (
    <Canvas {...{ project, label: currentLabel, figures, onChange: updateLabel, onSelectFigure: getCurrentLabel }} />
  )
}