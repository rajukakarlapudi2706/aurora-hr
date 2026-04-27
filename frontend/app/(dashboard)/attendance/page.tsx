"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from "date-fns";
import { ChevronLeft, ChevronRight, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { attendanceApi, employeesApi } from "@/lib/api";
import { getStatusColor } from "@/lib/utils";
import type { Attendance } from "@/types";
import { useAppStore } from "@/store/useAppStore";

const STATUS_COLORS: Record<string, string> = {
  Present: "#22c55e", Absent: "#ef4444", Leave: "#3b82f6",
  "Half Day": "#f59e0b", Holiday: "#8b5cf6", Weekoff: "#94a3b8",
};

export default function AttendancePage() {
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");
  const [markStatus, setMarkStatus] = useState<string>("Present");
  const [sheetOpen, setSheetOpen] = useState(false);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ["attendance", month, year, selectedEmployeeId],
    queryFn: () => attendanceApi.list({
      from_date: format(startOfMonth(currentDate), "yyyy-MM-dd"),
      to_date: format(endOfMonth(currentDate), "yyyy-MM-dd"),
      ...(selectedEmployeeId && selectedEmployeeId !== "all" ? { employee_id: selectedEmployeeId } : {}),
      limit: 200,
    }),
  });

  const { data: employeesData } = useQuery({
    queryKey: ["employees", "select"],
    queryFn: () => employeesApi.list({ limit: 200, status: "Active" }),
  });

  const markMutation = useMutation({
    mutationFn: (data: { employee_id: string; attendance_date: string; status: string }) =>
      attendanceApi.mark(data),
    onSuccess: () => {
      toast.success("Attendance marked");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      setSheetOpen(false);
    },
    onError: () => toast.error("Failed to mark attendance"),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      attendanceApi.approve(id, action),
    onSuccess: () => {
      toast.success("Attendance updated");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: () => toast.error("Failed to update attendance"),
  });

  const records: Attendance[] = attendanceData?.data?.items ?? [];
  const employees = employeesData?.data?.items ?? [];
  const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });

  const getDateStatus = (d: Date): Attendance | undefined =>
    records.find((r) => r.attendance_date === format(d, "yyyy-MM-dd"));

  const summaryData = Object.entries(
    records.reduce((acc: Record<string, number>, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground text-sm">Track and manage employee attendance</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{format(currentDate, "MMMM yyyy")}</CardTitle>
                <div className="flex items-center gap-2">
                  {user?.role !== "employee" && (
                    <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                      <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="All employees" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All employees</SelectItem>
                        {employees.map((e: { id: string; first_name: string; last_name: string }) => (
                          <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Weekday labels */}
              <div className="grid grid-cols-7 gap-1 mt-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="grid grid-cols-7 gap-1">{Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for first week offset */}
                  {Array.from({ length: days[0].getDay() }).map((_, i) => <div key={`e${i}`} />)}
                  {days.map((day) => {
                    const record = getDateStatus(day);
                    const isWknd = isWeekend(day);
                    const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                    return (
                      <motion.button
                        key={day.toISOString()}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => { setSelectedDate(day); setSheetOpen(true); }}
                        className={`relative h-12 rounded-md flex flex-col items-center justify-center gap-0.5 text-xs transition-colors
                          ${isWknd ? "bg-muted/40 text-muted-foreground" : "hover:bg-muted/60 cursor-pointer"}
                          ${isToday ? "ring-2 ring-brand-500" : ""}
                          ${record ? "text-foreground" : ""}
                        `}
                        style={record ? { backgroundColor: STATUS_COLORS[record.status] + "33" } : {}}
                      >
                        <span className="font-medium">{format(day, "d")}</span>
                        {record && (
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[record.status] }} />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-1.5 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-muted-foreground">{status}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary + Pending */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Summary</CardTitle></CardHeader>
            <CardContent>
              {summaryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={summaryData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value">
                        {summaryData.map((entry, i) => (
                          <Cell key={i} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {summaryData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[item.name] }} />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-sm text-muted-foreground text-center py-4">No records this month</p>}
            </CardContent>
          </Card>

          {/* Pending approvals */}
          {user?.role !== "employee" && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-brand-600" />Pending Approvals</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {records.filter(r => r.approval_status === "Pending").slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 text-xs py-1.5 border-b last:border-0">
                    <div>
                      <p className="font-medium">{r.attendance_date}</p>
                      <Badge className={getStatusColor(r.status) + " text-xs py-0"}>{r.status}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => approveMutation.mutate({ id: r.id, action: "approve" })}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => approveMutation.mutate({ id: r.id, action: "reject" })}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {records.filter(r => r.approval_status === "Pending").length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No pending approvals</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Mark Attendance Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle>Mark Attendance</SheetTitle>
            <p className="text-sm text-muted-foreground">{selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}</p>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {user?.role !== "employee" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Employee</label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e: { id: string; first_name: string; last_name: string }) => (
                      <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {["Present", "Absent", "Leave", "Half Day", "Holiday", "Weekoff"].map((s) => (
                  <Button
                    key={s}
                    variant={markStatus === s ? "default" : "outline"}
                    size="sm"
                    className="justify-start"
                    onClick={() => setMarkStatus(s)}
                    style={markStatus === s ? { backgroundColor: STATUS_COLORS[s], borderColor: STATUS_COLORS[s] } : {}}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              className="w-full mt-4"
              disabled={!selectedEmployeeId || selectedEmployeeId === "all" || !selectedDate || markMutation.isPending}
              onClick={() => {
                if (!selectedDate || !selectedEmployeeId) return;
                markMutation.mutate({
                  employee_id: selectedEmployeeId,
                  attendance_date: format(selectedDate, "yyyy-MM-dd"),
                  status: markStatus,
                });
              }}
            >
              {markMutation.isPending ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
