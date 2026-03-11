import useDialogState from "@/hooks/use-dialog-state";
import React from "react";
import type { Label } from "../data/schema";

type LabelsDialogType = "create" | "edit" | "delete";

interface LabelsContextType {
  open: LabelsDialogType | null;
  setOpen: (str: LabelsDialogType | null) => void;
  currentLabel: Label | null;
  setCurrentLabel: React.Dispatch<React.SetStateAction<Label | null>>;
  labels: Label[];
  setLabels: React.Dispatch<React.SetStateAction<Label[]>>;
  updateLabel: (updatedLabel: Label) => void;
  hiddenLabelIds: Set<string>;
  toggleLabelHidden: (labelId: string) => void;
  isLabelHidden: (labelId: string) => boolean;
}

const LabelsContext = React.createContext<LabelsContextType | null>(null);

interface Props {
  children: React.ReactNode;
}

export default function LabelsProvider({ children }: Props) {
  const [open, setOpen] = useDialogState<LabelsDialogType>(null);
  const [currentLabel, setCurrentLabel] = React.useState<Label | null>(null);
  const [labels, setLabels] = React.useState<Label[]>([]);
  const [hiddenLabelIds, setHiddenLabelIds] = React.useState<Set<string>>(
    () => new Set(),
  );

  const updateLabel = React.useCallback((updatedLabel: Label) => {
    setLabels((prev) =>
      prev.map((label) =>
        label.id === updatedLabel.id ? { ...label, ...updatedLabel } : label,
      ),
    );
    setCurrentLabel((prev) => {
      if (!prev || prev.id !== updatedLabel.id) return prev;
      return { ...prev, ...updatedLabel };
    });
  }, []);

  const toggleLabelHidden = React.useCallback((labelId: string) => {
    setHiddenLabelIds((prev) => {
      const next = new Set(prev);
      if (next.has(labelId)) {
        next.delete(labelId);
      } else {
        next.add(labelId);
      }
      return next;
    });
  }, []);

  const isLabelHidden = React.useCallback(
    (labelId: string) => {
      return hiddenLabelIds.has(labelId);
    },
    [hiddenLabelIds],
  );

  return (
    <LabelsContext.Provider
      value={{
        open,
        setOpen,
        currentLabel,
        setCurrentLabel,
        labels,
        setLabels,
        updateLabel,
        hiddenLabelIds,
        toggleLabelHidden,
        isLabelHidden,
      }}
    >
      {children}
    </LabelsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLabels = () => {
  const labelsContext = React.useContext(LabelsContext);

  if (!labelsContext) {
    throw new Error("useLabels must be used within a LabelsProvider");
  }
  return labelsContext;
};
