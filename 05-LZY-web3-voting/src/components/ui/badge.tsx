import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-300 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-[#e6007a] to-[#552bbf] text-white shadow-md shadow-[#e6007a]/30 [a&]:hover:shadow-lg [a&]:hover:shadow-[#e6007a]/50",
        secondary:
          "border-transparent bg-gradient-to-r from-[#552bbf] to-[#00b2ff] text-white shadow-md shadow-[#552bbf]/30 [a&]:hover:shadow-lg [a&]:hover:shadow-[#552bbf]/50",
        destructive:
          "border-transparent bg-gradient-to-r from-[#ff4d88] to-[#e6007a] text-white shadow-md shadow-[#ff4d88]/30 [a&]:hover:shadow-lg [a&]:hover:shadow-[#ff4d88]/50 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-[#e6007a]/50 text-foreground [a&]:hover:bg-[#e6007a]/10 [a&]:hover:border-[#e6007a] dark:text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
