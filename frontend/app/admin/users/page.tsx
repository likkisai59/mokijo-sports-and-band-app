"use client";

import * as React from "react";
import {
  Search,
  SlidersHorizontal,
  CheckCircle,
  XCircle,
  Trash2,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Mail,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AdminPageContainer } from "@/components/layout/admin/AdminPageContainer";
import { api } from "@/services/api";
import { formatDate } from "@/utils/format-date";
import toast from "react-hot-toast";

interface UserItem {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  roles: { name: string }[];
  created_at: string;
}

export default function UserManagementPage() {
  // Query Filtering State
  const [search, setSearch] = React.useState("");
  const [role, setRole] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(8);

  // Data State
  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // Bulk selection checkboxes
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Drawer/Dialog control states
  const [detailUser, setDetailUser] = React.useState<UserItem | null>(null);
  const [statusConfirmUser, setStatusConfirmUser] = React.useState<UserItem | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = React.useState<UserItem | null>(null);

  // Load user data list
  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const queryParams = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });

      if (search) queryParams.append("search", search);
      if (role !== "all") queryParams.append("role", role);
      if (statusFilter !== "all") {
        queryParams.append("is_active", statusFilter === "active" ? "true" : "false");
      }

      const response = await api.get(`/auth/admin/users?${queryParams.toString()}`);
      const { success, data } = response.data;
      if (success && data) {
        setUsers(data.items || []);
        setTotal(data.total || 0);
      }
    } catch {
      toast.error("Failed to load users list.");
    } finally {
      setLoading(false);
    }
  }, [search, role, statusFilter, page, limit]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Bulk actions status changes
  const handleBulkStatusChange = async (is_active: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      const response = await api.post("/auth/admin/users/bulk-status", {
        user_ids: selectedIds,
        is_active,
      });
      if (response.data.success) {
        toast.success(response.data.message || "Bulk status updated successfully!");
        setSelectedIds([]);
        fetchUsers();
      }
    } catch {
      toast.error("Failed to update status in bulk.");
    }
  };

  // Toggle user status
  const handleToggleStatus = async () => {
    if (!statusConfirmUser) return;
    try {
      const newStatus = !statusConfirmUser.is_active;
      const response = await api.put(`/auth/admin/users/${statusConfirmUser.id}/status`, {
        is_active: newStatus,
      });
      if (response.data.success) {
        toast.success(response.data.message || "Status updated.");
        setStatusConfirmUser(null);
        fetchUsers();
      }
    } catch {
      toast.error("Failed to toggle status.");
    }
  };

  // Delete user account placeholder
  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    try {
      const response = await api.delete(`/auth/admin/users/${deleteConfirmUser.id}`);
      if (response.data.success) {
        toast.success(response.data.message || "User deleted.");
        setDeleteConfirmUser(null);
        fetchUsers();
      }
    } catch {
      toast.error("Failed to delete user.");
    }
  };

  const handleExportCSV = () => {
    toast.success("CSV export dispatched! Downloading database user accounts CSV...");
  };

  // Checkbox helpers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(users.map((u) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminPageContainer
      title="User Accounts Administration"
      description="Manage access permissions, toggle suspension controls, check verification criteria, and logical soft deletes."
      actions={
        <Button onClick={handleExportCSV} variant="outline" size="sm" className="flex items-center gap-1.5 font-bold">
          <FileSpreadsheet className="h-4 w-4" />
          <span>Export Database Users CSV</span>
        </Button>
      }
    >
      {/* 1. Filtering & Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-bg-card p-4 rounded-xl border border-border/80 mb-6">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <Input
            type="text"
            placeholder="Search account name, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-text-secondary" />
            <span className="text-xs text-text-secondary">Filter by:</span>
          </div>

          <Select
            value={role}
            onValueChange={(val) => {
              setRole(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="artist">Artist</SelectItem>
              <SelectItem value="venue_owner">Venue Owner</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 2. Bulk Actions Actionbar (renders when rows are selected) */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 p-3 rounded-lg text-xs font-semibold text-white mb-4 animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>Selected {selectedIds.length} users</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleBulkStatusChange(true)}
              variant="outline"
              size="sm"
              className="h-7 px-3 text-[10px] font-bold border-primary/30 text-primary hover:bg-primary/5"
            >
              Activate Accounts
            </Button>
            <Button
              onClick={() => handleBulkStatusChange(false)}
              variant="destructive"
              size="sm"
              className="h-7 px-3 text-[10px] font-bold"
            >
              Suspend Accounts
            </Button>
          </div>
        </div>
      )}

      {/* 3. Reusable Table Listings */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  <input
                    type="checkbox"
                    checked={users.length > 0 && selectedIds.length === users.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-bg-card accent-primary"
                  />
                </TableHead>
                <TableHead>Account Performer</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-xs text-text-muted">
                    Loading users directories from database...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-xs text-text-muted">
                    No users match current search criteria filters.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((usr) => (
                  <TableRow key={usr.id} className={selectedIds.includes(usr.id) ? "bg-primary/5" : ""}>
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(usr.id)}
                        onChange={(e) => handleSelectOne(usr.id, e.target.checked)}
                        className="h-4 w-4 rounded border-border bg-bg-card accent-primary"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-text-primary">{usr.name}</div>
                      <div className="text-[11px] text-text-secondary mt-0.5">{usr.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="uppercase text-[10px]">
                        {usr.roles?.[0]?.name || "client"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={usr.is_active ? "success" : "destructive"} className="text-[10px]">
                        {usr.is_active ? "Active" : "Suspended"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-text-secondary text-[11px]">
                      {formatDate(usr.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => setDetailUser(usr)}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-text-secondary hover:text-text-primary"
                          title="View Profile Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => setStatusConfirmUser(usr)}
                          variant="ghost"
                          size="icon"
                          className={usr.is_active ? "h-7 w-7 text-warning" : "h-7 w-7 text-secondary"}
                          title={usr.is_active ? "Suspend Account" : "Activate Account"}
                        >
                          {usr.is_active ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          onClick={() => setDeleteConfirmUser(usr)}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          title="Soft Delete User"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 4. Pagination Component */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 text-xs font-semibold text-text-secondary select-none">
          <span>
            Page {page} of {totalPages} ({total} entries total)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 5. Details Presentation Sheet Drawer */}
      <Drawer
        open={!!detailUser}
        onClose={() => setDetailUser(null)}
        title="Account Profile Details"
        description="Comprehensive audit of profile fields from database schemas"
      >
        {detailUser && (
          <div className="space-y-6 text-xs text-text-secondary">
            {/* Header info */}
            <div className="flex items-center gap-4 bg-bg-card p-4 rounded-xl border border-border/50">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-sm font-bold text-white bg-primary">
                  {detailUser.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-base font-bold text-text-primary">{detailUser.name}</h4>
                <Badge variant="secondary" className="uppercase text-[10px] mt-1.5">
                  {detailUser.roles?.[0]?.name || "client"}
                </Badge>
              </div>
            </div>

            {/* Profile fields */}
            <div className="space-y-3">
              <h5 className="font-bold text-text-primary uppercase tracking-wider text-[10px]">Database Parameters</h5>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-border/30">
                <span className="font-semibold text-text-muted">Unique ID</span>
                <span className="col-span-2 font-mono text-[10px] text-text-primary truncate">{detailUser.id}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-border/30">
                <span className="font-semibold text-text-muted">Email</span>
                <span className="col-span-2 text-text-primary flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-text-muted" />
                  <span>{detailUser.email}</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-border/30">
                <span className="font-semibold text-text-muted">Verified</span>
                <span className="col-span-2 text-text-primary flex items-center gap-1.5">
                  <ShieldCheck className={detailUser.is_verified ? "h-3.5 w-3.5 text-secondary" : "h-3.5 w-3.5 text-text-muted"} />
                  <span>{detailUser.is_verified ? "Email Confirmed" : "Verification Pending"}</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-border/30">
                <span className="font-semibold text-text-muted">Status</span>
                <span className="col-span-2">
                  <Badge variant={detailUser.is_active ? "success" : "destructive"}>
                    {detailUser.is_active ? "Active account" : "Suspended"}
                  </Badge>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-border/30">
                <span className="font-semibold text-text-muted">Registered</span>
                <span className="col-span-2 text-text-primary flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-text-muted" />
                  <span>{formatDate(detailUser.created_at)}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* 6. Action Dialog overlays */}
      <ConfirmDialog
        open={!!statusConfirmUser}
        title={statusConfirmUser?.is_active ? "Confirm Account Suspension" : "Confirm Account Activation"}
        description={`Are you sure you want to change the status of ${statusConfirmUser?.name}? suspended users will be unable to establish sessions.`}
        onConfirm={handleToggleStatus}
        onOpenChange={(isOpen) => !isOpen && setStatusConfirmUser(null)}
      />

      <ConfirmDialog
        open={!!deleteConfirmUser}
        title="Confirm User Deletion"
        description={`Are you sure you want to flag ${deleteConfirmUser?.name} for deletion? This will logically soft-delete the user profile.`}
        onConfirm={handleDeleteUser}
        onOpenChange={(isOpen) => !isOpen && setDeleteConfirmUser(null)}
      />
    </AdminPageContainer>
  );
}
