"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Tag,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Languages,
  Music,
  Wrench,
  Building
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AdminPageContainer } from "@/components/layout/admin/AdminPageContainer";
import { api } from "@/services/api";
import { formatDate } from "@/utils/format-date";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

interface CategoryItem {
  id: string;
  name: string;
  type: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

// Zod Form validation schema
const categoryFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().max(255, "Description must be under 255 characters").optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

const categoryTabs = [
  { label: "Music Genres", value: "music_genre", icon: Music },
  { label: "Languages", value: "language", icon: Languages },
  { label: "Event Types", value: "event_type", icon: Calendar },
  { label: "Band Types", value: "band_type", icon: Tag },
  { label: "Equipments", value: "equipment_category", icon: Wrench },
  { label: "Venues", value: "venue_category", icon: Building },
];

export default function CategoryManagementPage() {
  const [activeTab, setActiveTab] = React.useState("music_genre");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);

  // Data States
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // Modals Toggles
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<CategoryItem | null>(null);
  const [statusConfirmCategory, setStatusConfirmCategory] = React.useState<CategoryItem | null>(null);
  const [deleteConfirmCategory, setDeleteConfirmCategory] = React.useState<CategoryItem | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
  });

  const fetchCategories = React.useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const queryParams = new URLSearchParams({
        type: activeTab,
        limit: String(limit),
        offset: String(offset),
      });

      if (search) queryParams.append("search", search);

      const response = await api.get(`/categories?${queryParams.toString()}`);
      const { success, data } = response.data;
      if (success && data) {
        setCategories(data.items || []);
        setTotal(data.total || 0);
      }
    } catch {
      toast.error("Failed to load category taxonomy list.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, page, limit]);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Open creation dialog
  const handleOpenCreate = () => {
    setEditingCategory(null);
    reset({ name: "", description: "" });
    setFormDialogOpen(true);
  };

  // Open edit dialog
  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    reset({ name: cat.name, description: cat.description || "" });
    setFormDialogOpen(true);
  };

  // Submit create or update
  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        // Update API
        const response = await api.put(`/categories/${editingCategory.id}`, data);
        if (response.data.success) {
          toast.success(response.data.message || "Category updated successfully!");
          setFormDialogOpen(false);
          fetchCategories();
        }
      } else {
        // Create API
        const response = await api.post("/categories", {
          ...data,
          type: activeTab,
          is_active: true,
        });
        if (response.data.success) {
          toast.success(response.data.message || "Category created successfully!");
          setFormDialogOpen(false);
          fetchCategories();
        }
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      const errMsg = error.response?.data?.error?.message || "Failed to save category.";
      toast.error(errMsg);
    }
  };

  // Toggle category status
  const handleToggleStatus = async () => {
    if (!statusConfirmCategory) return;
    try {
      const newStatus = !statusConfirmCategory.is_active;
      const response = await api.put(`/categories/${statusConfirmCategory.id}`, {
        is_active: newStatus,
      });
      if (response.data.success) {
        toast.success(response.data.message || "Status updated.");
        setStatusConfirmCategory(null);
        fetchCategories();
      }
    } catch {
      toast.error("Failed to toggle status.");
    }
  };

  // Delete category taxonomy
  const handleDeleteCategory = async () => {
    if (!deleteConfirmCategory) return;
    try {
      const response = await api.delete(`/categories/${deleteConfirmCategory.id}`);
      if (response.data.success) {
        toast.success(response.data.message || "Category deleted.");
        setDeleteConfirmCategory(null);
        fetchCategories();
      }
    } catch {
      toast.error("Failed to delete category.");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminPageContainer
      title="Platform Taxonomy & Categories"
      description="Configure standard taxonomy drop-down options: music genres, languages, and booking filters options."
      actions={
        <Button onClick={handleOpenCreate} className="flex items-center gap-1.5 font-bold">
          <Plus className="h-4 w-4" />
          <span>Add New Category</span>
        </Button>
      }
    >
      {/* 1. Category Tabs Bar */}
      <div className="flex border-b border-border mb-6 overflow-x-auto gap-2 pb-1 scrollbar-none select-none">
        {categoryTabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value);
                setSearch("");
                setPage(1);
              }}
              type="button"
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg border transition-all whitespace-nowrap cursor-pointer",
                isActive
                  ? "bg-primary border-primary text-white"
                  : "bg-bg-card border-border/80 text-text-secondary hover:text-white"
              )}
            >
              <TabIcon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Search toolbar */}
      <div className="relative w-full sm:w-80 mb-6">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
        <Input
          type="text"
          placeholder="Search category name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-8 h-9 text-xs"
        />
      </div>

      {/* 3. Reusable Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Creation Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-xs text-text-muted">
                    Loading taxonomies from database...
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-xs text-text-muted">
                    No taxonomy categories matching active filter.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-bold text-text-primary text-xs">{cat.name}</TableCell>
                    <TableCell className="text-text-secondary text-xs max-w-xs truncate">
                      {cat.description || <span className="text-text-muted">No description</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cat.is_active ? "success" : "destructive"} className="text-[10px]">
                        {cat.is_active ? "Active" : "Suspended"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-text-secondary text-[11px]">
                      {formatDate(cat.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleOpenEdit(cat)}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-text-secondary hover:text-text-primary"
                          title="Edit Details"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => setStatusConfirmCategory(cat)}
                          variant="ghost"
                          size="icon"
                          className={cat.is_active ? "h-7 w-7 text-warning" : "h-7 w-7 text-secondary"}
                          title={cat.is_active ? "Suspend Option" : "Activate Option"}
                        >
                          {cat.is_active ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          onClick={() => setDeleteConfirmCategory(cat)}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          title="Soft Delete Option"
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

      {/* 4. Pagination */}
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

      {/* 5. Create/Update Form Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent onClose={() => setFormDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category Details" : "Create Taxonomy Category"}</DialogTitle>
            <DialogDescription>
              Assign taxonomy options for type: <span className="text-primary font-bold">{activeTab}</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 text-xs">
            <div className="space-y-1">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                placeholder="e.g. Rock, Wedding, Sound System"
                disabled={isSubmitting}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-error font-medium mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Description Details</Label>
              <Textarea
                id="description"
                placeholder="Optional description of taxonomy use case..."
                disabled={isSubmitting}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-error font-medium mt-1">{errors.description.message}</p>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setFormDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Action Dialog warnings */}
      <ConfirmDialog
        open={!!statusConfirmCategory}
        title={statusConfirmCategory?.is_active ? "Confirm Category Suspension" : "Confirm Category Activation"}
        description={`Are you sure you want to change status of ${statusConfirmCategory?.name}? disabled taxonomies will not be selectable.`}
        onConfirm={handleToggleStatus}
        onOpenChange={(isOpen) => !isOpen && setStatusConfirmCategory(null)}
      />

      <ConfirmDialog
        open={!!deleteConfirmCategory}
        title="Confirm Category Deletion"
        description={`Are you sure you want to delete ${deleteConfirmCategory?.name}? this soft-deletes the item.`}
        onConfirm={handleDeleteCategory}
        onOpenChange={(isOpen) => !isOpen && setDeleteConfirmCategory(null)}
      />
    </AdminPageContainer>
  );
}
