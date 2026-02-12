"use client";

import { Sidebar } from "@/components/Sidebar";
import { AIChatbot } from "@/components/AIChatbot";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) router.push("/login");
  }, [isLoading, token, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[260px_1fr]">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex flex-col">
        <main className="flex-1 p-6 bg-muted/30 overflow-auto">
          {children}
        </main>
      </div>
      <AIChatbot />
    </div>
  );
}
