"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  token: string;
}

interface AppState {
  user: AuthUser | null;
  sidebarCollapsed: boolean;
  setUser: (user: AuthUser | null) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      sidebarCollapsed: false,
      setUser: (user) => {
        set({ user });
        if (user) localStorage.setItem("hrms_token", user.token);
        else localStorage.removeItem("hrms_token");
      },
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      logout: () => {
        localStorage.removeItem("hrms_token");
        set({ user: null });
      },
    }),
    { name: "hrms-app-store", partialize: (s) => ({ user: s.user, sidebarCollapsed: s.sidebarCollapsed }) }
  )
);
