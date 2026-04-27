"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from "date-fns";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { attendanceApi } from "@/lib/api";
import type { Attendance } from "@/types";

interface AttendanceCalendarProps {
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
  attendanceRecords?: Attendance[];
  isLoading?: boolean;
  onDateSelect?: (date: Date) => void;
  selectedEmployeeId?: string;
}

const STATUS_CONFIG: Record<string, { bg: string; dot: string; label: string }> = {
  Present: { bg: "bg-green-100 dark:bg-green-900/30", dot: "bg-green-500", label: "P" },
  Absent: { bg: "bg-red-100 dark:bg-red-900/30", dot: "bg-red-500", label: "A" },
  Leave: { bg: "bg-blue-100 dark:bg-blue-900/30", dot: "bg-blue-500", label: "L" },
  "Half Day": { bg: "bg-yellow-100 dark:bg-yellow-900/30", dot: "bg-yellow-500", label: "H" },
  Holiday: { bg: "bg-purple-100 dark:bg-purple-900/30", dot: "bg-purple-500", label: "X" },
  Weekoff: { bg: "bg-gray-100 dark:bg-gray-900/30", dot: "bg-gray-400", label: "W" },
};

export function AttendanceCalendar({
  month,
  year,
  onMonthChange,
  attendanceRecords = [],
  isLoading = false,
  onDateSelect,
  selectedEmployeeId,
}: AttendanceCalendarProps) {
  const queryClient = useQueryClient();
  const startDate = startOfMonth(new Date(year, month - 1, 1));
  const endDate = endOfMonth(startDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const attendanceMap = new Map(
    attendanceRecords.map((r) => [
      format(new Date(r.attendance_date), "yyyy-MM-dd"),
      r.status,
    ])
  );

  const handlePrevMonth = () => {
    if (month === 1) {
      onMonthChange(12, year - 1);
    } else {
      onMonthChange(month - 1, year);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(1, year + 1);
    } else {
      onMonthChange(month + 1, year);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">
            {format(new Date(year, month - 1, 1), "MMMM yyyy")}
          </CardTitle>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((date, idx) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const status = attendanceMap.get(dateStr);
              const isWknd = isWeekend(date);
              const config = status ? STATUS_CONFIG[status] : null;

              return (
                <motion.button
                  key={dateStr}
                  onClick={() => onDateSelect?.(date)}
                  whileHover={{ scale: 1.05 }}
                  className={`
                    relative p-2 rounded-lg text-xs font-medium transition-all
                    ${config ? config.bg : isWknd ? "bg-muted" : "bg-card border border-border"}
                    ${!isLoading ? "cursor-pointer hover:shadow-sm" : ""}
                  `}
                >
                  <span className={config ? "text-foreground font-semibold" : "text-muted-foreground"}>
                    {format(date, "d")}
                  </span>
                  {config && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <div key={status} className="flex items-center gap-1.5 text-xs">
                <div className={`h-2 w-2 rounded-full ${config.dot}`} />
                <span className="text-muted-foreground">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
