import useDialogState from "@/hooks/use-dialog-state";
import React from "react";
import type { Label } from "../data/schema";


type LabelsDialogType = 'create' | 'edit' | 'delete';

interface LabelsContextType {
  open: LabelsDialogType | null;
  setOpen: (str: LabelsDialogType | null) => void;
  currentLabel: Label | null;
  setCurrentLabel: React.Dispatch<React.SetStateAction<Label | null>>;
  labels: Label[];
  setLabels: React.Dispatch<React.SetStateAction<Label[]>>;
  updateLabel: (updatedLabel: Label) => void;
}

const LabelsContext = React.createContext<LabelsContextType | null>(null)

interface Props {
  children: React.ReactNode;
}

export default function LabelsProvider({ children }: Props) {
  const [open, setOpen] = useDialogState<LabelsDialogType>(null);
  const [currentLabel, setCurrentLabel] = React.useState<Label | null>(null);
  const [labels, setLabels] = React.useState<Label[]>([]);

  const updateLabel = React.useCallback((updatedLabel: Label) => {
    console.log('updateLabel', updatedLabel)
    setLabels(prev => prev.map(label => label.id === updatedLabel.id ? { ...label, ...updatedLabel } : label))
  }, [setLabels])

  return (
    <LabelsContext value={{ open, setOpen, currentLabel, setCurrentLabel, labels, setLabels, updateLabel }}>
      {children}
    </LabelsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLabels = () => {
  const labelsContext = React.useContext(LabelsContext)

  if (!labelsContext) {
    throw new Error('useLabels must be used within a LabelsProvider')
  }
  return labelsContext;
}