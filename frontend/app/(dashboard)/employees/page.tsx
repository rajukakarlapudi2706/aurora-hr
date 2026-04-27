"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  flexRender, getCoreRowModel, useReactTable, getSortedRowModel,
  getFilteredRowModel, type SortingState, type ColumnDef,
} from "@tanstack/react-table";
import { Plus, Search, Upload, LayoutGrid, List, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { employeesApi } from "@/lib/api";
import { getInitials, getStatusColor, formatDate } from "@/lib/utils";
import type { Employee } from "@/types";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { BulkImport } from "@/components/employees/BulkImport";

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["employees", page, search],
    queryFn: () => employeesApi.list({ page, limit: 25, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee deleted");
    },
    onError: () => toast.error("Failed to delete employee"),
  });

  const employees: Employee[] = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const pages = data?.data?.pages ?? 1;

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "first_name",
      header: "Employee",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-brand-100 text-brand-700">
              {getInitials(`${row.original.first_name} ${row.original.last_name}`)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{row.original.first_name} {row.original.last_name}</p>
            <p className="text-xs text-muted-foreground">{row.original.employee_id}</p>
          </div>
        </div>
      ),
    },
    { accessorKey: "email", header: "Email", cell: ({ getValue }) => <span className="text-sm">{getValue() as string}</span> },
    { accessorKey: "designation", header: "Designation", cell: ({ getValue }) => <span className="text-sm">{(getValue() as string) ?? "—"}</span> },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => <span className="text-sm">{row.original.department?.name ?? "—"}</span>,
    },
    {
      accessorKey: "joining_date",
      header: "Joined",
      cell: ({ getValue }) => <span className="text-sm">{getValue() ? formatDate(getValue() as string) : "—"}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => <Badge className={getStatusColor(getValue() as string)}>{getValue() as string}</Badge>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditEmployee(row.original); setShowForm(true); }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive"
            onClick={() => { if (confirm("Delete this employee?")) deleteMutation.mutate(row.original.id); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: employees,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground text-sm">{total} total employees</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-2" /> Import
          </Button>
          <Button size="sm" onClick={() => { setEditEmployee(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Employee
          </Button>
        </div>
      </motion.div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, ID..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex border rounded-md">
          <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-r-none" onClick={() => setViewMode("table")}><List className="h-4 w-4" /></Button>
          <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-l-none" onClick={() => setViewMode("grid")}><LayoutGrid className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Table / Grid */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : viewMode === "table" ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header) => (
                        <th key={header.id} className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer select-none" onClick={header.column.getToggleSortingHandler()}>
                          <div className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === "asc" ? <ChevronUp className="h-3 w-3" /> : header.column.getIsSorted() === "desc" ? <ChevronDown className="h-3 w-3" /> : null}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row, i) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map((emp, i) => (
            <motion.div key={emp.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -2 }}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-brand-100 text-brand-700 font-semibold">
                        {getInitials(`${emp.first_name} ${emp.last_name}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{emp.first_name} {emp.last_name}</p>
                      <p className="text-xs text-muted-foreground">{emp.employee_id}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="truncate">{emp.designation ?? "—"}</p>
                    <p>{emp.department?.name ?? "—"}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(emp.status)} >{emp.status}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditEmployee(emp); setShowForm(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, total)} of {total}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      {/* Employee Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            employee={editEmployee}
            onSuccess={() => {
              setShowForm(false);
              queryClient.invalidateQueries({ queryKey: ["employees"] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent>
          <DialogHeader><DialogTitle>Bulk Import Employees</DialogTitle></DialogHeader>
          <BulkImport onSuccess={() => { setShowImport(false); queryClient.invalidateQueries({ queryKey: ["employees"] }); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
