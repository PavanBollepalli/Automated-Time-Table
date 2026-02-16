"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, Calendar, BookOpen, Building2,
  GraduationCap, LogOut, Bell, Shield, Layers, ClipboardList, Clock
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: string[];
}

const navItems: NavItem[] = [
  // Admin
  { label: "Dashboard", icon: Shield, href: "/admin", roles: ["admin"] },
  { label: "Programs", icon: GraduationCap, href: "/admin/programs", roles: ["admin"] },
  { label: "Courses", icon: BookOpen, href: "/admin/courses", roles: ["admin"] },
  { label: "Faculty", icon: Users, href: "/admin/faculty", roles: ["admin"] },
  { label: "Rooms", icon: Building2, href: "/admin/rooms", roles: ["admin"] },
  { label: "Generate Timetable", icon: Calendar, href: "/admin/generate", roles: ["admin"] },
  { label: "All Timetables", icon: Layers, href: "/admin/timetables", roles: ["admin"] },
  { label: "Schedule Settings", icon: Clock, href: "/admin/schedule", roles: ["admin"] },
  { label: "User Management", icon: ClipboardList, href: "/admin/users", roles: ["admin"] },
  // Faculty
  { label: "Dashboard", icon: LayoutDashboard, href: "/faculty", roles: ["faculty"] },
  { label: "My Timetable", icon: Calendar, href: "/faculty/timetable", roles: ["faculty"] },
  // Student
  { label: "Dashboard", icon: LayoutDashboard, href: "/student", roles: ["student"] },
  { label: "Timetables", icon: Calendar, href: "/student/timetable", roles: ["student"] },
  // DEO
  { label: "Dashboard", icon: LayoutDashboard, href: "/deo", roles: ["deo"] },
  { label: "Programs", icon: GraduationCap, href: "/deo/programs", roles: ["deo"] },
  { label: "Courses", icon: BookOpen, href: "/deo/courses", roles: ["deo"] },
  { label: "Faculty", icon: Users, href: "/deo/faculty", roles: ["deo"] },
  { label: "Rooms", icon: Building2, href: "/deo/rooms", roles: ["deo"] },
  { label: "Generate Timetable", icon: Calendar, href: "/deo/generate", roles: ["deo"] },
  { label: "Timetables", icon: Layers, href: "/deo/timetables", roles: ["deo"] },
  { label: "Schedule Settings", icon: Clock, href: "/deo/schedule", roles: ["deo"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role || "";

  const filtered = navItems.filter((item) => item.roles.includes(role));

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="flex h-[60px] items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-7 w-7 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-lg shadow-sm" />
          <span className="font-bold text-lg tracking-tight">IntelliScheduler</span>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filtered.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              pathname === item.href
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-3">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <p className="text-xs font-medium text-foreground capitalize">{role}</p>
        </div>
        <Button variant="ghost" onClick={logout} className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10">
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </div>
    </div>
  );
}
