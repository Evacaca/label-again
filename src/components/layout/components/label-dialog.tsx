import { useLabels } from "../context/labels-context"
import { LabelActionDialog } from "./label-action-dialog"

export function LabelDialog() {
  const { open, setOpen, currentLabel } = useLabels();
  return <>
    <LabelActionDialog open={open === 'create'} onOpenChange={() => setOpen('create')} />
    {currentLabel &&
      <LabelActionDialog open={open === 'edit'} onOpenChange={() => setOpen('edit')} currentRow={currentLabel} />
    }
  </>
}