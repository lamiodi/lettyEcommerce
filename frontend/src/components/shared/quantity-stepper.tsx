"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export function QuantityStepper({
  quantity,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  className,
}: QuantityStepperProps) {
  const buttonSize = size === "sm" ? "h-7 w-7" : "h-10 w-10";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div
      className={cn(
        "inline-flex items-center border border-line bg-transparent",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Decrease quantity"
        className={cn(buttonSize, "rounded-none")}
        disabled={quantity <= min}
        onClick={() => onChange(quantity - 1)}
      >
        <Minus className={iconSize} />
      </Button>
      <span
        aria-live="polite"
        className={cn(
          "flex items-center justify-center font-medium tabular-nums",
          size === "sm" ? "w-8 text-xs" : "w-10 text-sm",
        )}
      >
        {quantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Increase quantity"
        className={cn(buttonSize, "rounded-none")}
        disabled={quantity >= max}
        onClick={() => onChange(quantity + 1)}
      >
        <Plus className={iconSize} />
      </Button>
    </div>
  );
}
