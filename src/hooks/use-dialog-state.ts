import React from "react";

export default function useDialogState<T extends boolean | string>(
  initialValue: T | null
) {
  const [open, _setOpen] = React.useState<T | null>(initialValue);

  const setOpen = (value: T | null) => {
    return _setOpen((prev) => (prev == value ? null : value));
  };

  return [open, setOpen] as const;
}
