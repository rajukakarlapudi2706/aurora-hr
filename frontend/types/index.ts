export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: "admin" | "manager" | "employee";
}

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  designation?: string;
  status: "Active" | "Inactive" | "Separated";
  joining_date?: string;
  department?: Department;
  pan_number?: string;
  aadhaar_number?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  attendance_date: string;
  status: "Present" | "Absent" | "Leave" | "Half Day" | "Holiday" | "Weekoff";
  remarks?: string;
  approval_status: "Pending" | "Approved" | "Rejected";
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  leave: number;
  half_day: number;
  holiday: number;
  weekoff: number;
  total_working_days: number;
}

export interface LeaveType {
  id: string;
  name: string;
  max_days_per_year: number;
}

export interface LeaveBalance {
  id: string;
  leave_type: LeaveType;
  available_balance: number;
  utilized_balance: number;
}

export interface LeaveApplication {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  from_date: string;
  to_date: string;
  number_of_days: number;
  reason?: string;
  status: "Applied" | "Approved" | "Rejected";
  rejection_reason?: string;
}

export interface SalaryStructure {
  id: string;
  employee_id: string;
  basic_salary: number;
  da: number;
  hra: number;
  other_allowances: number;
  pf_percentage: number;
}

export interface PayrollRun {
  id: string;
  month_year: string;
  status: "Draft" | "Processing" | "Processed" | "Approved";
  total_employees: number;
  total_amount: number;
}

export interface PayrollDetail {
  id: string;
  employee_id: string;
  working_days: number;
  basic_salary: number;
  allowances: number;
  gross_salary: number;
  pf_deduction: number;
  esic_deduction: number;
  tds_deduction: number;
  net_salary: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
