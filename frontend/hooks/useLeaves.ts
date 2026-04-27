import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leavesApi } from "@/lib/api";

export function useLeaveTypes() {
  return useQuery({
    queryKey: ["leave-types"],
    queryFn: () => leavesApi.types(),
  });
}

export function useLeaveBalance(employeeId?: string) {
  return useQuery({
    queryKey: ["leave-balance", employeeId],
    queryFn: () => leavesApi.balance(employeeId),
  });
}

export function useLeaveApplications(
  page: number = 1,
  limit: number = 25,
  status?: string
) {
  return useQuery({
    queryKey: ["leave-applications", page, limit, status],
    queryFn: () => leavesApi.applications({ page, limit, ...(status ? { status } : {}) }),
  });
}

export function useApplyLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => leavesApi.apply(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
      queryClient.invalidateQueries({ queryKey: ["leave-applications"] });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; action: string; rejection_reason?: string }) =>
      leavesApi.action(data.id, { action: data.action, rejection_reason: data.rejection_reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-applications"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
    },
  });
}
