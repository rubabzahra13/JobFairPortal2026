"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { openStoredCvPdf } from "@/lib/cv-storage";
import { cn } from "@/lib/utils";

interface ViewCvButtonProps {
  submissionId: string;
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "icon";
  className?: string;
}

export function ViewCvButton({
  submissionId,
  label = "View CV",
  variant = "outline",
  size = "sm",
  className,
}: ViewCvButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const ok = await openStoredCvPdf(submissionId);
      if (!ok) {
        window.alert(
          "No PDF on file for this submission. It may have been uploaded before CV storage was enabled."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(size === "sm" && "h-7 gap-1.5 text-xs", className)}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
      ) : (
        <FileText className="h-3.5 w-3.5 shrink-0" />
      )}
      {size !== "icon" && <span>{label}</span>}
    </Button>
  );
}
