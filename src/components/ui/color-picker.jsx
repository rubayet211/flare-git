"use client";

import { useCallback, useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ColorPicker({
  label,
  color,
  onChange,
  className,
  swatches = [
    "#000000",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#3b82f6",
    "#6366f1",
    "#a855f7",
    "#ec4899",
  ],
}) {
  const [selectedColor, setSelectedColor] = useState(color);

  useEffect(() => {
    setSelectedColor(color);
  }, [color]);

  const handleChange = useCallback(
    (color) => {
      setSelectedColor(color);
      onChange?.(color);
    },
    [onChange]
  );

  return (
    <div className={cn("grid gap-2", className)}>
      {label && <Label>{label}</Label>}
      <div className="flex flex-wrap gap-2">
        {swatches.map((swatch) => (
          <button
            key={swatch}
            className={cn(
              "h-6 w-6 rounded-md border",
              selectedColor === swatch && "ring-2 ring-primary ring-offset-2"
            )}
            style={{ backgroundColor: swatch }}
            onClick={() => handleChange(swatch)}
            type="button"
          >
            <span className="sr-only">Pick color: {swatch}</span>
          </button>
        ))}
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => handleChange(e.target.value)}
          className="h-6 w-6 cursor-pointer appearance-none rounded-md border bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md"
        />
      </div>
    </div>
  );
}
