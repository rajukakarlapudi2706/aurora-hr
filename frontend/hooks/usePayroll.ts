import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { payrollApi } from "@/lib/api";

export function usePayrollRuns(limit: number = 12) {
  return useQuery({
    queryKey: ["payroll-runs"],
    queryFn: () => payrollApi.listRuns({ limit }),
  });
}

export function usePayrollRun(runId: string) {
  return useQuery({
    queryKey: ["payroll-run", runId],
    queryFn: () => payrollApi.getRun(runId),
    enabled: !!runId,
  });
}

export function usePayrollDetails(runId: string, limit: number = 50) {
  return useQuery({
    queryKey: ["payroll-details", runId],
    queryFn: () => payrollApi.getRunDetails(runId, { limit }),
    enabled: !!runId,
  });
}

export function useProcessPayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (monthYear: string) => payrollApi.process(monthYear),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-runs"] });
    },
  });
}

export function usePayrollRunStatus(runId: string, interval: number = 3000) {
  return useQuery({
    queryKey: ["payroll-run-status", runId],
    queryFn: () => payrollApi.getRun(runId),
    enabled: !!runId,
    refetchInterval: (data: any) =>
      data?.status === "Processing" ? interval : false,
  });
}
