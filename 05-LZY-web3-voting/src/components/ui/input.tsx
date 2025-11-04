import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground glass-effect flex h-12 w-full min-w-0 rounded-2xl border border-white/10 px-4 py-3 text-base transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-[#e6007a] focus-visible:shadow-lg focus-visible:ring-4 focus-visible:shadow-[#e6007a]/20 focus-visible:ring-[#e6007a]/30",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "hover:border-[#e6007a]/50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
