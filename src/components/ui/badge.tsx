import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Grade variants
        gradeA: "border-transparent bg-green-500 text-white",
        gradeAB: "border-transparent bg-green-400 text-white",
        gradeB: "border-transparent bg-blue-500 text-white",
        gradeBC: "border-transparent bg-blue-400 text-white",
        gradeC: "border-transparent bg-yellow-500 text-white",
        gradeD: "border-transparent bg-orange-500 text-white",
        gradeF: "border-transparent bg-red-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

// Helper component for grade badges
interface GradeBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  grade: string;
}

function GradeBadge({ grade, className, ...props }: GradeBadgeProps) {
  const variantMap: Record<string, VariantProps<typeof badgeVariants>["variant"]> = {
    A: "gradeA",
    AB: "gradeAB",
    B: "gradeB",
    BC: "gradeBC",
    C: "gradeC",
    D: "gradeD",
    F: "gradeF",
  };

  return (
    <Badge
      variant={variantMap[grade] || "outline"}
      className={className}
      {...props}
    >
      {grade}
    </Badge>
  );
}

export { Badge, badgeVariants, GradeBadge };
