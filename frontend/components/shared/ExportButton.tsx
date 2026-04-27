"use client";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExportButtonProps {
  onExport: (format: "excel" | "csv") => Promise<void>;
  isLoading?: boolean;
}

export function ExportButton({ onExport, isLoading = false }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport(format: "excel" | "csv") {
    setLoading(true);
    try {
      await onExport(format);
      toast.success(`Export started as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading || isLoading}>
          {loading || isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          <span className="ml-2">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("excel")}>Excel (.xlsx)</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")}>CSV (.csv)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
