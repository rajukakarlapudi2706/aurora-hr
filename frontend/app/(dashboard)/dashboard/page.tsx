"use client";
import { useQuery } from "@tanstack/react-query";
import { Users, Clock, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { employeesApi, attendanceApi, payrollApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

const ATTENDANCE_COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#f59e0b"];

const mockAttendanceTrend = Array.from({ length: 14 }, (_, i) => ({
  date: format(new Date(Date.now() - (13 - i) * 86400000), "MMM d"),
  present: Math.floor(Math.random() * 20) + 70,
  absent: Math.floor(Math.random() * 10) + 5,
}));

export default function DashboardPage() {
  const { data: employeesData } = useQuery({
    queryKey: ["employees", "dashboard"],
    queryFn: () => employeesApi.list({ limit: 1 }),
  });

  const { data: payrollData } = useQuery({
    queryKey: ["payroll-runs", "dashboard"],
    queryFn: () => payrollApi.listRuns({ limit: 1 }),
  });

  const totalEmployees = employeesData?.data?.total ?? 0;
  const latestRun = payrollData?.data?.items?.[0];

  const pieData = [
    { name: "Present", value: 72 },
    { name: "Absent", value: 8 },
    { name: "Leave", value: 12 },
    { name: "Half Day", value: 8 },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Employees"
          value={totalEmployees}
          subtitle="Active workforce"
          icon={Users}
          trend={{ value: 4, positive: true }}
          delay={0}
        />
        <StatsCard
          title="Present Today"
          value="72%"
          subtitle="86 out of 120"
          icon={Clock}
          trend={{ value: 2, positive: true }}
          delay={0.1}
        />
        <StatsCard
          title="Pending Approvals"
          value="14"
          subtitle="Leave + Attendance"
          icon={Calendar}
          delay={0.2}
        />
        <StatsCard
          title="Payroll This Month"
          value={latestRun ? formatCurrency(latestRun.total_amount) : "—"}
          subtitle={latestRun?.month_year ?? "Not processed"}
          icon={DollarSign}
          trend={{ value: 1.2, positive: false }}
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Trend */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-brand-600" />
                Attendance Trend (Last 14 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={mockAttendanceTrend}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="present" stroke="#3b82f6" fill="url(#colorPresent)" strokeWidth={2} name="Present" />
                  <Area type="monotone" dataKey="absent" stroke="#ef4444" fill="transparent" strokeWidth={2} strokeDasharray="4 4" name="Absent" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Attendance Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Today&apos;s Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={ATTENDANCE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 w-full mt-2">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: ATTENDANCE_COLORS[i] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium ml-auto">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
