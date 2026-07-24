import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Sizing — comfortable tap target, slightly larger on larger screens.
        "h-11 w-full min-w-0 py-2 text-base md:h-12 md:text-[15px]",
        // Editorial line-only treatment (project's design language).
        "border-0 border-b border-line bg-transparent px-0",
        // Typography & color
        "font-sans text-ink placeholder:text-stone/60 placeholder:font-normal",
        // Motion
        "transition-[border-color,color] duration-300 ease-out",
        // File picker (kept for compatibility)
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        // Hover — gentle ink lift on the hairline
        "hover:border-ink/50",
        // Focus — consistent with FAQ search: ink hairline, no rings
        "focus-visible:border-ink focus-visible:outline-none focus-visible:ring-0",
        // Invalid — keep the ink line but mark it with the brand's alert tone
        "aria-invalid:border-destructive/70 aria-invalid:text-ink",
        // Disabled — clearly quiet, not just dimmed
        "disabled:cursor-not-allowed disabled:border-line/60 disabled:text-stone/60 disabled:placeholder:text-stone/50 disabled:opacity-70",
        // Autofill fix — keep the ink text color when the browser fills the field
        "[&:-webkit-autofill]:[-webkit-text-fill-color:var(--ink)] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_transparent]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
