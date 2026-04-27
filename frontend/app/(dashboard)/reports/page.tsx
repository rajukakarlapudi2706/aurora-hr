"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Download, Users, Clock, Calendar, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { reportsApi, attendanceApi, downloadBlob } from "@/lib/api";

interface ReportConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  hasMonthPicker?: boolean;
}

const REPORTS: ReportConfig[] = [
  { id: "employees", title: "Employee Directory", description: "Complete list of all employees with department and status", icon: Users, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
  { id: "attendance", title: "Attendance Report", description: "Monthly attendance summary for all employees", icon: Clock, color: "text-green-600 bg-green-50 dark:bg-green-900/20", hasMonthPicker: true },
  { id: "leave-balance", title: "Leave Balance Report", description: "Current leave balances for all employees", icon: Calendar, color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20" },
  { id: "payroll", title: "Payroll Summary", description: "Detailed payroll breakdown for a selected month", icon: DollarSign, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20", hasMonthPicker: true },
];

export default function ReportsPage() {
  const [monthInputs, setMonthInputs] = useState<Record<string, string>>({
    attendance: format(new Date(), "yyyy-MM"),
    payroll: format(new Date(), "yyyy-MM"),
  });
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  async function handleDownload(reportId: string) {
    setLoading((l) => ({ ...l, [reportId]: true }));
    try {
      let res;
      if (reportId === "employees") {
        res = await reportsApi.employees();
        downloadBlob(res.data, "employees.xlsx");
      } else if (reportId === "leave-balance") {
        res = await reportsApi.leaveBalance();
        downloadBlob(res.data, "leave-balances.xlsx");
      } else if (reportId === "attendance") {
        const [year, month] = (monthInputs.attendance ?? "").split("-").map(Number);
        res = await attendanceApi.exportReport(month, year);
        downloadBlob(res.data, `attendance-${monthInputs.attendance}.xlsx`);
      } else if (reportId === "payroll") {
        res = await reportsApi.payroll(monthInputs.payroll ?? "");
        downloadBlob(res.data, `payroll-${monthInputs.payroll}.xlsx`);
      }
      toast.success("Report downloaded");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? "Failed to generate report");
    } finally {
      setLoading((l) => ({ ...l, [reportId]: false }));
    }
  }

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground text-sm">Generate and download HR reports as Excel files</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORTS.map((r, i) => {
          const Icon = r.icon;
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -2 }}
            >
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${r.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{r.title}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">{r.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {r.hasMonthPicker && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Month</Label>
                      <Input
                        type="month"
                        className="h-8 text-sm"
                        value={monthInputs[r.id] ?? format(new Date(), "yyyy-MM")}
                        onChange={(e) => setMonthInputs(prev => ({ ...prev, [r.id]: e.target.value }))}
                      />
                    </div>
                  )}
                  <Button
                    onClick={() => handleDownload(r.id)}
                    disabled={loading[r.id]}
                    className="w-full"
                    variant="outline"
                  >
                    {loading[r.id]
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                      : <><Download className="mr-2 h-4 w-4" />Download Excel</>
                    }
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
