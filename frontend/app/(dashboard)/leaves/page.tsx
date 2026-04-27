"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, isWeekend, eachDayOfInterval } from "date-fns";
import { Plus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { leavesApi } from "@/lib/api";
import { getStatusColor, formatDate } from "@/lib/utils";
import type { LeaveBalance, LeaveApplication, LeaveType } from "@/types";
import { useAppStore } from "@/store/useAppStore";

const applySchema = z.object({
  leave_type_id: z.string().min(1, "Select leave type"),
  from_date: z.string().min(1, "Select from date"),
  to_date: z.string().min(1, "Select to date"),
  reason: z.string().optional(),
});
type ApplyForm = z.infer<typeof applySchema>;

function BalanceRing({ available, total, color }: { available: number; total: number; color: string }) {
  const pct = total > 0 ? (available / total) : 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  return (
    <svg width="88" height="88" className="rotate-[-90deg]">
      <circle cx="44" cy="44" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
      <motion.circle
        cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeLinecap="round"
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
    </svg>
  );
}

const LEAVE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b"];

export default function LeavesPage() {
  const user = useAppStore((s) => s.user);
  const queryClient = useQueryClient();
  const [applyOpen, setApplyOpen] = useState(false);

  const { data: balancesData, isLoading: balancesLoading } = useQuery({
    queryKey: ["leave-balances"],
    queryFn: () => leavesApi.balance(),
  });
  const { data: typesData } = useQuery({
    queryKey: ["leave-types"],
    queryFn: () => leavesApi.types(),
  });
  const { data: applicationsData } = useQuery({
    queryKey: ["leave-applications"],
    queryFn: () => leavesApi.applications({ limit: 50 }),
  });

  const applyMutation = useMutation({
    mutationFn: (data: ApplyForm) => leavesApi.apply(data),
    onSuccess: () => {
      toast.success("Leave applied successfully");
      queryClient.invalidateQueries({ queryKey: ["leave-applications"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
      setApplyOpen(false);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? "Failed to apply leave");
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      leavesApi.action(id, { action }),
    onSuccess: (_, vars) => {
      toast.success(vars.action === "approve" ? "Leave approved" : "Leave rejected");
      queryClient.invalidateQueries({ queryKey: ["leave-applications"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
    onError: () => toast.error("Action failed"),
  });

  const balances: LeaveBalance[] = balancesData?.data ?? [];
  const leaveTypes: LeaveType[] = typesData?.data ?? [];
  const applications: LeaveApplication[] = applicationsData?.data?.items ?? [];
  const pendingApps = applications.filter(a => a.status === "Applied");

  const { register, handleSubmit, control, formState: { errors } } = useForm<ApplyForm>({
    resolver: zodResolver(applySchema),
  });

  function countWorkingDays(from: string, to: string): number {
    if (!from || !to) return 0;
    try {
      const days = eachDayOfInterval({ start: new Date(from), end: new Date(to) });
      return days.filter(d => !isWeekend(d)).length;
    } catch { return 0; }
  }

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground text-sm">Apply and manage leave requests</p>
        </div>
        <Button onClick={() => setApplyOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Apply Leave
        </Button>
      </motion.div>

      {/* Balance Cards */}
      {balancesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {balances.map((b, i) => {
            const total = Number(b.available_balance) + Number(b.utilized_balance);
            const color = LEAVE_COLORS[i % LEAVE_COLORS.length];
            return (
              <motion.div key={b.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} whileHover={{ y: -2 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="relative">
                      <BalanceRing available={Number(b.available_balance)} total={total} color={color} />
                      <div className="absolute inset-0 flex items-center justify-center rotate-90">
                        <span className="text-lg font-bold">{b.available_balance}</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">{b.leave_type.name}</p>
                      <p className="text-sm text-muted-foreground">Available</p>
                      <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                        <p>Used: <span className="text-foreground font-medium">{b.utilized_balance}</span></p>
                        <p>Total: <span className="text-foreground font-medium">{total}</span></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Applications Tabs */}
      <Tabs defaultValue="my">
        <TabsList>
          <TabsTrigger value="my">My Leaves</TabsTrigger>
          {user?.role !== "employee" && (
            <TabsTrigger value="pending">
              Pending Approvals
              {pendingApps.length > 0 && (
                <span className="ml-2 bg-brand-600 text-white text-xs rounded-full px-1.5 py-0.5">{pendingApps.length}</span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    {["Type", "From", "To", "Days", "Reason", "Status", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, i) => (
                    <motion.tr key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">{app.leave_type.name}</td>
                      <td className="px-4 py-3">{formatDate(app.from_date)}</td>
                      <td className="px-4 py-3">{formatDate(app.to_date)}</td>
                      <td className="px-4 py-3 font-medium">{app.number_of_days}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground">{app.reason ?? "—"}</td>
                      <td className="px-4 py-3"><Badge className={getStatusColor(app.status)}>{app.status}</Badge></td>
                      <td className="px-4 py-3">
                        {app.status === "Applied" && (
                          <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive h-7" onClick={() => leavesApi.cancel(app.id).then(() => { queryClient.invalidateQueries({ queryKey: ["leave-applications"] }); toast.success("Leave cancelled"); })}>
                            Cancel
                          </Button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                  {applications.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No leave applications</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {user?.role !== "employee" && (
          <TabsContent value="pending">
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      {["Employee", "Type", "From", "To", "Days", "Reason", "Actions"].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApps.map((app, i) => (
                      <motion.tr key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{app.employee_id.slice(-8)}</td>
                        <td className="px-4 py-3">{app.leave_type.name}</td>
                        <td className="px-4 py-3">{formatDate(app.from_date)}</td>
                        <td className="px-4 py-3">{formatDate(app.to_date)}</td>
                        <td className="px-4 py-3">{app.number_of_days}</td>
                        <td className="px-4 py-3 max-w-[150px] truncate text-muted-foreground">{app.reason ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:bg-green-50" onClick={() => actionMutation.mutate({ id: app.id, action: "approve" })}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => actionMutation.mutate({ id: app.id, action: "reject" })}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                    {pendingApps.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No pending approvals</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Apply Leave Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => applyMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Leave Type</Label>
              <Controller
                control={control}
                name="leave_type_id"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.leave_type_id && <p className="text-xs text-destructive">{errors.leave_type_id.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>From Date</Label>
                <Input type="date" {...register("from_date")} />
                {errors.from_date && <p className="text-xs text-destructive">{errors.from_date.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>To Date</Label>
                <Input type="date" {...register("to_date")} />
                {errors.to_date && <p className="text-xs text-destructive">{errors.to_date.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Input placeholder="Brief reason for leave" {...register("reason")} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" type="button" onClick={() => setApplyOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={applyMutation.isPending}>
                {applyMutation.isPending ? "Applying..." : "Apply Leave"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
