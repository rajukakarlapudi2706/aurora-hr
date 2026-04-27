"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Play, Download, FileText, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { payrollApi, downloadBlob } from "@/lib/api";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import type { PayrollRun, PayrollDetail } from "@/types";
import { useAppStore } from "@/store/useAppStore";

const STATUS_ICON: Record<string, React.ReactNode> = {
  Processed: <CheckCircle className="h-4 w-4 text-green-600" />,
  Processing: <Clock className="h-4 w-4 text-blue-500 animate-spin" />,
  Draft: <AlertCircle className="h-4 w-4 text-gray-400" />,
};

export default function PayrollPage() {
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [slipOpen, setSlipOpen] = useState(false);

  const currentMonthYear = format(new Date(), "yyyy-MM");

  const { data: runsData, isLoading } = useQuery({
    queryKey: ["payroll-runs"],
    queryFn: () => payrollApi.listRuns({ limit: 12 }),
  });

  const { data: detailsData } = useQuery({
    queryKey: ["payroll-details", selectedRun?.id],
    queryFn: () => payrollApi.getRunDetails(selectedRun!.id, { limit: 100 }),
    enabled: !!selectedRun && detailsOpen,
  });

  const { data: runStatusData } = useQuery({
    queryKey: ["payroll-run-status", selectedRun?.id],
    queryFn: () => payrollApi.getRun(selectedRun!.id),
    enabled: !!selectedRun && selectedRun.status === "Processing",
    refetchInterval: (query) => query.state.data?.data?.status === "Processing" ? 3000 : false,
  });

  const processMutation = useMutation({
    mutationFn: (month_year: string) => payrollApi.process(month_year),
    onSuccess: () => {
      toast.success("Payroll processing started!");
      queryClient.invalidateQueries({ queryKey: ["payroll-runs"] });
      setConfirmOpen(false);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? "Failed to process payroll");
      setConfirmOpen(false);
    },
  });

  const runs: PayrollRun[] = runsData?.data?.items ?? [];
  const details: PayrollDetail[] = detailsData?.data?.items ?? [];

  const chartData = details.slice(0, 10).map((d) => ({
    name: `EMP-${d.employee_id.slice(-4)}`,
    Gross: Number(d.gross_salary),
    Net: Number(d.net_salary),
    Deductions: Number(d.gross_salary) - Number(d.net_salary),
  }));

  async function handleDownloadPayslip(detailId: string, empId: string) {
    try {
      const res = await payrollApi.downloadPayslip(detailId);
      downloadBlob(res.data, `payslip-${empId}.pdf`);
    } catch {
      toast.error("Failed to download payslip");
    }
  }

  async function handleDownloadNeft(runId: string, monthYear: string) {
    try {
      const res = await payrollApi.downloadNeft(runId);
      downloadBlob(res.data, `neft-${monthYear}.csv`);
    } catch {
      toast.error("Failed to download NEFT file");
    }
  }

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground text-sm">Process and manage monthly payroll</p>
        </div>
        {user?.role === "admin" && (
          <Button onClick={() => setConfirmOpen(true)}>
            <Play className="h-4 w-4 mr-2" />Run Payroll — {format(new Date(), "MMM yyyy")}
          </Button>
        )}
      </motion.div>

      {/* Payroll Runs Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {runs.map((run, i) => (
            <motion.div
              key={run.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedRun(run); setDetailsOpen(true); }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{run.month_year}</h3>
                    <div className="flex items-center gap-1.5">
                      {STATUS_ICON[run.status] ?? null}
                      <Badge className={getStatusColor(run.status)}>{run.status}</Badge>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Employees</span><span className="font-medium text-foreground">{run.total_employees}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total Net</span><span className="font-medium text-foreground">{formatCurrency(run.total_amount)}</span>
                    </div>
                  </div>
                  {run.status === "Processed" && user?.role === "admin" && (
                    <Button
                      variant="outline" size="sm" className="w-full mt-3"
                      onClick={(e) => { e.stopPropagation(); handleDownloadNeft(run.id, run.month_year); }}
                    >
                      <Download className="h-3.5 w-3.5 mr-2" />NEFT File
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Confirm Process Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run Payroll for {format(new Date(), "MMMM yyyy")}?</DialogTitle>
            <DialogDescription>
              This will calculate salaries for all active employees based on their attendance and salary structure.
              This action can be re-run if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={() => processMutation.mutate(currentMonthYear)} disabled={processMutation.isPending}>
              {processMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : "Confirm & Run"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Run Details Sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Payroll Details — {selectedRun?.month_year}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {chartData.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Salary Breakdown (Top 10)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                      <Legend />
                      <Bar dataKey="Gross" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Net" fill="#22c55e" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    {["Employee", "Days", "Gross", "PF", "ESIC", "TDS", "Net", ""].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {details.map((d) => (
                    <tr key={d.id} className="border-b hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{d.employee_id.slice(-8)}</td>
                      <td className="px-3 py-2">{d.working_days}</td>
                      <td className="px-3 py-2">{formatCurrency(d.gross_salary)}</td>
                      <td className="px-3 py-2 text-red-500">-{formatCurrency(d.pf_deduction)}</td>
                      <td className="px-3 py-2 text-red-500">-{formatCurrency(d.esic_deduction)}</td>
                      <td className="px-3 py-2 text-red-500">-{formatCurrency(d.tds_deduction)}</td>
                      <td className="px-3 py-2 font-semibold text-green-600">{formatCurrency(d.net_salary)}</td>
                      <td className="px-3 py-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownloadPayslip(d.id, d.employee_id)}>
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {details.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No payroll details found</p>}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
