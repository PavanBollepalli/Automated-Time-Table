"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-1">View and manage system users</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">Coming Soon</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-md">
            User management features including role assignment, account activation, and audit logs will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
