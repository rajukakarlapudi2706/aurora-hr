import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api";

export function useAttendance(month: number, year: number, employeeId?: string) {
  return useQuery({
    queryKey: ["attendance", month, year, employeeId],
    queryFn: () =>
      attendanceApi.list({
        month,
        year,
        ...(employeeId ? { employee_id: employeeId } : {}),
      }),
  });
}

export function useSummary(employeeId: string, month: number, year: number) {
  return useQuery({
    queryKey: ["attendance-summary", employeeId, month, year],
    queryFn: () => attendanceApi.summary(employeeId, month, year),
    enabled: !!employeeId,
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => attendanceApi.mark(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}
