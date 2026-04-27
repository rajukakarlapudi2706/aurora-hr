"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SalaryBreakdownProps {
  data: Array<{
    name: string;
    earnings: number;
    deductions: number;
  }>;
  isLoading?: boolean;
}

export function SalaryBreakdown({ data, isLoading = false }: SalaryBreakdownProps) {
  if (isLoading || !data?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Salary Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] flex items-center justify-center text-muted-foreground">
            {isLoading ? "Loading chart..." : "No data available"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Salary Breakdown (Top Employees)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
              }}
            />
            <Legend />
            <Bar dataKey="earnings" fill="#3b82f6" name="Earnings" radius={[8, 8, 0, 0]} />
            <Bar dataKey="deductions" fill="#ef4444" name="Deductions" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
