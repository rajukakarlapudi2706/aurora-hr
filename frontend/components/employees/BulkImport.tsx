"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { employeesApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props { onSuccess: () => void; }

export function BulkImport({ onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ total: number; success: number; failed: number; errors: string[] } | null>(null);

  const mutation = useMutation({
    mutationFn: (f: File) => employeesApi.bulkImport(f),
    onSuccess: (res) => {
      setResult(res.data);
      if (res.data.success > 0) {
        toast.success(`Imported ${res.data.success} employees`);
        onSuccess();
      }
    },
    onError: () => toast.error("Import failed"),
  });

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
    maxFiles: 1,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20" : "border-border hover:border-brand-400"
        )}
      >
        <input {...getInputProps()} />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium">Drop Excel file here or click to browse</p>
            <p className="text-xs text-muted-foreground">Only .xlsx files supported</p>
          </div>
        )}
      </div>

      {mutation.isPending && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Processing...</p>
          <Progress value={60} className="animate-pulse" />
        </div>
      )}

      {result && (
        <div className="rounded-lg border p-4 space-y-2">
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-green-600">
              <CheckCircle className="h-4 w-4" /> {result.success} imported
            </span>
            <span className="flex items-center gap-1.5 text-red-500">
              <XCircle className="h-4 w-4" /> {result.failed} failed
            </span>
          </div>
          {result.errors.length > 0 && (
            <div className="text-xs text-muted-foreground space-y-0.5 max-h-28 overflow-y-auto">
              {result.errors.map((e, i) => <p key={i} className="text-red-500">{e}</p>)}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => {
          const csvContent = "first_name,last_name,email,phone,designation,joining_date\nJohn,Doe,john@company.com,9876543210,Engineer,2024-01-01\n";
          const blob = new Blob([csvContent], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = "employee-template.csv"; a.click();
        }}>
          Download Template
        </Button>
        <Button size="sm" className="flex-1" disabled={!file || mutation.isPending} onClick={() => file && mutation.mutate(file)}>
          {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</> : "Import"}
        </Button>
      </div>
    </div>
  );
}
