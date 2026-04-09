// src/components/ui/Card.tsx
// A simple wrapper that gives consistent padding, border, and rounded corners.
// Accepting a className prop lets callers override or extend styles using cn().

import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className }: CardProps) {
  return (
    <div className={cn("bg-white border border-gray-100 rounded-2xl p-5", className)}>
      {children}
    </div>
  );
}