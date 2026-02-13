"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllUsers, bulkUploadUsers, deleteUser } from "@/lib/api";
import {
  Users,
  Upload,
  Loader2,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  X,
} from "lucide-react";

interface UserRecord {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
}

interface UploadError {
  row: number;
  errors: string[];
}

interface UploadResult {
  total_records: number;
  successfully_created: number;
  failed: number;
  errors: UploadError[];
  created_users: UserRecord[];
}

const ROLE_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  admin: "destructive",
  faculty: "default",
  hod: "secondary",
  student: "outline",
  deo: "secondary",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setError("Please upload a .xlsx or .xls file");
      return;
    }

    setUploading(true);
    setError("");
    setUploadResult(null);

    try {
      const result = await bulkUploadUsers(file);
      setUploadResult(result);
      // Reload user list after upload
      await loadUsers();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Upload failed. Please check the file format.");
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setDeleting(userId);
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to delete user");
    } finally {
      setDeleting(null);
    }
  };

  const downloadTemplate = () => {
    // Create a simple CSV template that can be opened in Excel and saved as .xlsx
    const headers = "full_name,username,email,password,role";
    const sampleRow = "John Doe,johndoe,john@example.com,Pass@123,student";
    const csvContent = `${headers}\n${sampleRow}`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user_upload_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredUsers =
    filterRole === "all" ? users : users.filter((u) => u.role === filterRole);

  const roleGroups = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Upload Excel files to create users in bulk, and manage existing users
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-1" /> Template
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1" />
            )}
            {uploading ? "Uploading..." : "Upload Excel"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-sm text-destructive border border-destructive/20 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Upload Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-2xl font-bold">{uploadResult.total_records}</p>
                <p className="text-xs text-muted-foreground">Total Records</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 p-3 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {uploadResult.successfully_created}
                </p>
                <p className="text-xs text-muted-foreground">Created</p>
              </div>
              <div
                className={`rounded-lg border p-3 text-center ${
                  uploadResult.failed > 0
                    ? "border-red-200 bg-red-50 dark:bg-red-950/30"
                    : ""
                }`}
              >
                <p
                  className={`text-2xl font-bold ${
                    uploadResult.failed > 0 ? "text-red-600" : ""
                  }`}
                >
                  {uploadResult.failed}
                </p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-4 w-4" /> Errors
                </p>
                <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-1">
                  {uploadResult.errors.map((err, i) => (
                    <div
                      key={i}
                      className="text-xs bg-muted/50 rounded px-2 py-1"
                    >
                      <span className="font-medium">Row {err.row}:</span>{" "}
                      {err.errors.join(", ")}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadResult.successfully_created > 0 && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {uploadResult.successfully_created} user(s) created successfully!
              </p>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUploadResult(null)}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload Instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Excel File Format</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Upload a <strong>.xlsx</strong> file with the following columns in the exact order:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-lg">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border px-3 py-2 text-left font-medium">full_name</th>
                  <th className="border px-3 py-2 text-left font-medium">username</th>
                  <th className="border px-3 py-2 text-left font-medium">email</th>
                  <th className="border px-3 py-2 text-left font-medium">password</th>
                  <th className="border px-3 py-2 text-left font-medium">role</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-3 py-2 text-muted-foreground">John Doe</td>
                  <td className="border px-3 py-2 text-muted-foreground">johndoe</td>
                  <td className="border px-3 py-2 text-muted-foreground">john@example.com</td>
                  <td className="border px-3 py-2 text-muted-foreground">Pass@123</td>
                  <td className="border px-3 py-2 text-muted-foreground">student</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Valid roles: <strong>admin</strong>, <strong>faculty</strong>,{" "}
            <strong>hod</strong>, <strong>student</strong>, <strong>deo</strong>.
            Password must be at least 6 characters.
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => setFilterRole("all")}
          className={`rounded-lg border p-3 text-center transition-colors hover:bg-muted/50 ${
            filterRole === "all" ? "ring-2 ring-primary" : ""
          }`}
        >
          <p className="text-2xl font-bold">{users.length}</p>
          <p className="text-xs text-muted-foreground">All Users</p>
        </button>
        {["admin", "faculty", "hod", "student", "deo"].map((role) => (
          <button
            key={role}
            onClick={() => setFilterRole(role)}
            className={`rounded-lg border p-3 text-center transition-colors hover:bg-muted/50 ${
              filterRole === role ? "ring-2 ring-primary" : ""
            }`}
          >
            <p className="text-2xl font-bold">{roleGroups[role] || 0}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </button>
        ))}
      </div>

      {/* User List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            {filterRole === "all"
              ? `All Users (${filteredUsers.length})`
              : `${filterRole.charAt(0).toUpperCase() + filterRole.slice(1)} Users (${filteredUsers.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-sm">
                No users found. Upload an Excel file to create users.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    <th className="px-3 py-2 text-left font-medium">Full Name</th>
                    <th className="px-3 py-2 text-left font-medium">Email</th>
                    <th className="px-3 py-2 text-left font-medium">Role</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, idx) => (
                    <tr
                      key={user.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                      <td className="px-3 py-2 font-medium">
                        {user.full_name || "—"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{user.email}</td>
                      <td className="px-3 py-2">
                        <Badge variant={ROLE_COLORS[user.role] || "outline"}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={user.is_active ? "default" : "destructive"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          disabled={deleting === user.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {deleting === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
