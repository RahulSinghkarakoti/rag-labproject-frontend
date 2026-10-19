import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  hidePromptPrefix?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hidePromptPrefix = false, ...props }, ref) => {
    if (hidePromptPrefix) {
      return (
        <input
          type={type}
          ref={ref}
          data-slot="input"
          className={cn(
            "h-9 w-full min-w-0 bg-[#12121a] border border-[#2a2a3a] cyber-chamfer-sm px-3 py-1 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 transition-none outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:pointer-events-none disabled:opacity-40",
            className
          )}
          {...props}
        />
      )
    }

    return (
      <div className="relative flex items-center w-full">
        <span className="absolute left-2.5 text-accent font-mono text-xs font-bold pointer-events-none select-none z-10">&gt;</span>
        <input
          type={type}
          ref={ref}
          data-slot="input"
          className={cn(
            "h-9 w-full min-w-0 bg-[#12121a] border border-[#2a2a3a] cyber-chamfer-sm pl-6 pr-3 py-1 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 transition-none outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:pointer-events-none disabled:opacity-40",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
