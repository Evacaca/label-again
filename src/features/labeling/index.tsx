import { useLabels } from "@/components/layout/context/labels-context";
import Canvas from "./canvas";

export default function Labeling() {
  const { currentLabel, updateLabel } = useLabels();


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