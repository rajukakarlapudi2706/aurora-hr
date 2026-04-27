"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { attendanceApi } from "@/lib/api";

const schema = z.object({
  status: z.enum(["Present", "Absent", "Leave", "Half Day"]),
  remarks: z.string().optional(),
});

type MarkForm = z.infer<typeof schema>;

interface MarkAttendanceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  employeeId: string;
  onSuccess?: () => void;
}

export function MarkAttendanceSheet({
  open,
  onOpenChange,
  date,
  employeeId,
  onSuccess,
}: MarkAttendanceSheetProps) {
  const queryClient = useQueryClient();
  const { control, handleSubmit, reset, formState: { errors } } = useForm<MarkForm>({
    resolver: zodResolver(schema),
    defaultValues: { status: "Present", remarks: "" },
  });

  const mutation = useMutation({
    mutationFn: (data: MarkForm) =>
      attendanceApi.mark({
        employee_id: employeeId,
        attendance_date: format(date!, "yyyy-MM-dd"),
        status: data.status,
        remarks: data.remarks,
      }),
    onSuccess: () => {
      toast.success("Attendance marked successfully");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: () => toast.error("Failed to mark attendance"),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Mark Attendance</SheetTitle>
          <SheetDescription>
            {date ? format(date, "EEEE, MMM d, yyyy") : "Select a date"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Present">Present</SelectItem>
                    <SelectItem value="Absent">Absent</SelectItem>
                    <SelectItem value="Leave">Leave</SelectItem>
                    <SelectItem value="Half Day">Half Day</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Controller
              name="remarks"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="remarks"
                  placeholder="Add any remarks or notes..."
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
              Mark
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
