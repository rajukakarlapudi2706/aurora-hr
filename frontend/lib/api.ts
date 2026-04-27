import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("hrms_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("hrms_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// --- Auth ---
export const authApi = {
  login: (email: string, password: string) => {
    const form = new URLSearchParams({ username: email, password });
    return api.post("/auth/login", form, { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
  },
  seedAdmin: () => api.post("/auth/seed-admin"),
};

// --- Employees ---
export const employeesApi = {
  list: (params?: Record<string, unknown>) => api.get("/employees", { params }),
  get: (id: string) => api.get(`/employees/${id}`),
  create: (data: unknown) => api.post("/employees", data),
  update: (id: string, data: unknown) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
  bulkImport: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/employees/bulk-import", form, { headers: { "Content-Type": "multipart/form-data" } });
  },
};

// --- Attendance ---
export const attendanceApi = {
  list: (params?: Record<string, unknown>) => api.get("/attendance", { params }),
  mark: (data: unknown) => api.post("/attendance", data),
  summary: (employee_id: string, month: number, year: number) =>
    api.get("/attendance/summary", { params: { employee_id, month, year } }),
  approve: (id: string, action: string) => api.post(`/attendance/${id}/approve`, null, { params: { action } }),
  exportReport: (month: number, year: number) =>
    api.get("/attendance/report/export", { params: { month, year }, responseType: "blob" }),
};

// --- Payroll ---
export const payrollApi = {
  listRuns: (params?: Record<string, unknown>) => api.get("/payroll/runs", { params }),
  getRun: (id: string) => api.get(`/payroll/runs/${id}`),
  getRunDetails: (id: string, params?: Record<string, unknown>) => api.get(`/payroll/runs/${id}/details`, { params }),
  getDetail: (detail_id: string) => api.get(`/payroll/runs/detail/${detail_id}`),
  process: (month_year: string) => api.post("/payroll/process", { month_year }),
  getSalaryStructure: (employee_id: string) => api.get(`/payroll/salary-structure/${employee_id}`),
  upsertSalaryStructure: (data: unknown) => api.post("/payroll/salary-structure", data),
  downloadPayslip: (detail_id: string) =>
    api.get(`/payroll/payslip/${detail_id}/pdf`, { responseType: "blob" }),
  downloadNeft: (run_id: string) =>
    api.get(`/payroll/runs/${run_id}/neft`, { responseType: "blob" }),
};

// --- Leaves ---
export const leavesApi = {
  types: () => api.get("/leaves/types"),
  balance: (employee_id?: string) => api.get("/leaves/balance", { params: employee_id ? { employee_id } : {} }),
  apply: (data: unknown) => api.post("/leaves/apply", data),
  applications: (params?: Record<string, unknown>) => api.get("/leaves/applications", { params }),
  action: (id: string, data: { action: string; rejection_reason?: string }) =>
    api.post(`/leaves/applications/${id}/action`, data),
  cancel: (id: string) => api.post(`/leaves/applications/${id}/cancel`),
};

// --- Reports ---
export const reportsApi = {
  employees: () => api.get("/reports/employees", { responseType: "blob" }),
  leaveBalance: () => api.get("/reports/leave-balance", { responseType: "blob" }),
  payroll: (month_year: string) => api.get(`/reports/payroll/${month_year}`, { responseType: "blob" }),
};

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
