import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    Inactive: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    Separated: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    Present: "bg-green-100 text-green-800",
    Absent: "bg-red-100 text-red-800",
    Leave: "bg-blue-100 text-blue-800",
    "Half Day": "bg-yellow-100 text-yellow-800",
    Holiday: "bg-purple-100 text-purple-800",
    Approved: "bg-green-100 text-green-800",
    Applied: "bg-yellow-100 text-yellow-800",
    Rejected: "bg-red-100 text-red-800",
    Processed: "bg-green-100 text-green-800",
    Processing: "bg-blue-100 text-blue-800",
    Draft: "bg-gray-100 text-gray-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
}
