import { useLabels } from "@/components/layout/context/labels-context";
import { useParams } from "@tanstack/react-router";
import Canvas from "./canvas";
import { useEffect } from "react";

export default function Labeling() {
  const { labelId } = useParams({ from: '/(label)/$labelId' });
  const { labels, setCurrentLabel, currentLabel, updateLabel } = useLabels();

  useEffect(() => {
    const label = labels.find(label => label.id === labelId);
    if (label) {
      setCurrentLabel(label)
    }
  }, [labelId, labels, setCurrentLabel])

  if (!currentLabel) return <div className="p-4">
    <h2 className='text-2xl font-bold tracking-tight'>Hello!</h2>
    <p className='text-muted-foreground'>
      标签无效，请先创建标签
    </p>
  </div>

  return (
    <Canvas key={currentLabel.id} label={currentLabel} onChange={updateLabel} />
  )
}