"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { payrollApi, downloadBlob } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { PayrollDetail } from "@/types";

interface PayslipDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detailId: string | null;
}

export function PayslipDrawer({ open, onOpenChange, detailId }: PayslipDrawerProps) {
  const { data: detail, isLoading } = useQuery({
    queryKey: ["payroll-detail", detailId],
    queryFn: () => (detailId ? payrollApi.getDetail(detailId) : Promise.resolve(null)),
    enabled: !!detailId && open,
  });

  const downloadMutation = useMutation({
    mutationFn: () => payrollApi.downloadPayslip(detailId!),
    onSuccess: (blob) => {
      downloadBlob(blob.data, `payslip-${detailId}.pdf`);
      toast.success("Payslip downloaded");
    },
    onError: () => toast.error("Failed to download payslip"),
  });

  if (!detail?.data && !isLoading) {
    return null;
  }

  const d = detail?.data;
  const chartData = d
    ? [
        { name: "Basic", value: d.basic_salary },
        { name: "Allowances", value: d.allowances || 0 },
      ]
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[600px] max-w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Payslip</SheetTitle>
          <SheetDescription>
            {d ? `${d.employee_name} - ${d.month_year}` : "Loading..."}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-3 mt-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : d ? (
          <div className="space-y-4 mt-6">
            {/* Employee Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Employee</p>
                    <p className="font-medium">{d.employee_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Employee ID</p>
                    <p className="font-medium">{d.employee_id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Month</p>
                    <p className="font-medium">{d.month_year}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium">{d.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Earnings */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-sm mb-3">Earnings</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Basic Salary</span>
                    <span className="font-medium">{formatCurrency(d.basic_salary)}</span>
                  </div>
                  {d.allowances > 0 && (
                    <div className="flex justify-between">
                      <span>Allowances</span>
                      <span className="font-medium">{formatCurrency(d.allowances)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Gross</span>
                    <span>{formatCurrency((d.basic_salary || 0) + (d.allowances || 0))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deductions */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-sm mb-3">Deductions</h3>
                <div className="space-y-2 text-sm">
                  {d.pf_deduction > 0 && (
                    <div className="flex justify-between">
                      <span>PF (12%)</span>
                      <span className="font-medium text-destructive">-{formatCurrency(d.pf_deduction)}</span>
                    </div>
                  )}
                  {d.esic_deduction > 0 && (
                    <div className="flex justify-between">
                      <span>ESIC</span>
                      <span className="font-medium text-destructive">-{formatCurrency(d.esic_deduction)}</span>
                    </div>
                  )}
                  {d.tds_deduction > 0 && (
                    <div className="flex justify-between">
                      <span>TDS</span>
                      <span className="font-medium text-destructive">-{formatCurrency(d.tds_deduction)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Deductions</span>
                    <span className="text-destructive">
                      -{formatCurrency((d.pf_deduction || 0) + (d.esic_deduction || 0) + (d.tds_deduction || 0))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Net Salary */}
            <Card className="border-brand-600 bg-brand-50 dark:bg-brand-900/20">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Net Salary</span>
                  <span className="text-2xl font-bold text-brand-600">{formatCurrency(d.net_salary)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="flex-1"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                size="sm"
                onClick={() => downloadMutation.mutate()}
                disabled={downloadMutation.isPending}
                className="flex-1"
              >
                {downloadMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Download PDF
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
