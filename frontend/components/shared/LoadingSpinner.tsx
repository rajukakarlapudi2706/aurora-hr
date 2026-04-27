"use client";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSpinnerProps {
  variant?: "spinner" | "skeleton" | "pulse";
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  message?: string;
}

export function LoadingSpinner({
  variant = "spinner",
  size = "md",
  fullScreen = false,
  message,
}: LoadingSpinnerProps) {
  if (variant === "skeleton") {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }[size];

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
        <Loader2 className={`${sizeClass} text-brand-600`} />
      </motion.div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">{content}</div>;
  }

  return <div className="flex justify-center py-8">{content}</div>;
}
