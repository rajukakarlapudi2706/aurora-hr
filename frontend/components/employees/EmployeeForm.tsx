"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { employeesApi } from "@/lib/api";
import type { Employee } from "@/types";

const schema = z.object({
  first_name: z.string().min(2, "Min 2 characters"),
  last_name: z.string().min(2, "Min 2 characters"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  designation: z.string().optional(),
  joining_date: z.string().optional(),
  gender: z.string().optional(),
  status: z.string().optional(),
  pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN").or(z.literal("")).optional(),
  bank_ifsc_code: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC").or(z.literal("")).optional(),
  bank_account_number: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  employee?: Employee | null;
  onSuccess: () => void;
}

export function EmployeeForm({ employee, onSuccess }: Props) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: employee ? {
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone ?? "",
      designation: employee.designation ?? "",
      joining_date: employee.joining_date ?? "",
      gender: employee.gender ?? "",
      status: employee.status,
      pan_number: employee.pan_number ?? "",
      bank_ifsc_code: employee.bank_ifsc_code ?? "",
      bank_account_number: employee.bank_account_number ?? "",
    } : {},
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      employee ? employeesApi.update(employee.id, data) : employeesApi.create(data),
    onSuccess: () => {
      toast.success(employee ? "Employee updated" : "Employee created");
      onSuccess();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg ?? "Failed to save employee");
    },
  });

  const field = (name: keyof FormData, label: string, type = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={type} {...register(name)} className={errors[name] ? "border-destructive" : ""} />
      {errors[name] && <p className="text-xs text-destructive">{errors[name]?.message}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      {/* Personal */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Personal</h3>
        <div className="grid grid-cols-2 gap-4">
          {field("first_name", "First Name")}
          {field("last_name", "Last Name")}
          {field("email", "Email", "email")}
          {field("phone", "Phone")}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select onValueChange={(v) => setValue("gender", v)} defaultValue={employee?.gender ?? ""}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {field("joining_date", "Joining Date", "date")}
        </div>
      </div>

      {/* Employment */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Employment</h3>
        <div className="grid grid-cols-2 gap-4">
          {field("designation", "Designation")}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select onValueChange={(v) => setValue("status", v)} defaultValue={employee?.status ?? "Active"}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Separated">Separated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* IDs */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Govt IDs</h3>
        <div className="grid grid-cols-2 gap-4">
          {field("pan_number", "PAN Number")}
        </div>
      </div>

      {/* Bank */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Bank Details</h3>
        <div className="grid grid-cols-2 gap-4">
          {field("bank_account_number", "Account Number")}
          {field("bank_ifsc_code", "IFSC Code")}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {employee ? "Update Employee" : "Create Employee"}
        </Button>
      </div>
    </form>
  );
}
