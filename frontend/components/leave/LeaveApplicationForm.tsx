"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { leavesApi } from "@/lib/api";
import type { LeaveType } from "@/types";

const schema = z.object({
  leave_type_id: z.string().min(1, "Select leave type"),
  from_date: z.string().min(1, "Select start date"),
  to_date: z.string().min(1, "Select end date"),
  reason: z.string().optional(),
});

type ApplyForm = z.infer<typeof schema>;

interface LeaveApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveTypes?: LeaveType[];
  onSuccess?: () => void;
}

export function LeaveApplicationForm({
  open,
  onOpenChange,
  leaveTypes = [],
  onSuccess,
}: LeaveApplicationFormProps) {
  const queryClient = useQueryClient();
  const { control, handleSubmit, reset, formState: { errors } } = useForm<ApplyForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      leave_type_id: "",
      from_date: "",
      to_date: "",
      reason: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ApplyForm) => leavesApi.apply(data),
    onSuccess: () => {
      toast.success("Leave application submitted");
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to apply leave");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leave_type">Leave Type</Label>
            <Controller
              name="leave_type_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="leave_type">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} ({type.max_days_per_year} days)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.leave_type_id && (
              <p className="text-xs text-destructive">{errors.leave_type_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="from_date">From Date</Label>
              <Controller
                name="from_date"
                control={control}
                render={({ field }) => (
                  <Input type="date" id="from_date" {...field} />
                )}
              />
              {errors.from_date && (
                <p className="text-xs text-destructive">{errors.from_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="to_date">To Date</Label>
              <Controller
                name="to_date"
                control={control}
                render={({ field }) => (
                  <Input type="date" id="to_date" {...field} />
                )}
              />
              {errors.to_date && (
                <p className="text-xs text-destructive">{errors.to_date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="reason"
                  placeholder="Reason for leave..."
                  {...field}
                  className="resize-none"
                  rows={3}
                />
              )}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button disabled={mutation.isPending} type="submit" className="flex-1">
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Apply
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
