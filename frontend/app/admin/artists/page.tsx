"use client";

import * as React from "react";
import Image from "next/image";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Video,
  Image as ImageIcon,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AdminPageContainer } from "@/components/layout/admin/AdminPageContainer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/services/api";
import { formatCurrency } from "@/utils/format-currency";
import toast from "react-hot-toast";

interface ArtistItem {
  id: string;
  user_id: string;
  user: {
    id: string;
    name: string;
    email: string;
    is_active: boolean;
  };
  bio: string | null;
  base_rate: number;
  rating: number;
  verification_status: "pending" | "approved" | "rejected";
  verification_notes: string | null;
  documents: { title: string; url: string }[];
  gallery: string[];
  videos: string[];
  pricing_details: Record<string, unknown>;
  genres: { id: string; name: string }[];
  languages: { id: string; name: string }[];
  created_at: string;
}

export default function AdminBandManagementPage() {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(8);

  // Data States
  const [artists, setArtists] = React.useState<ArtistItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // Modals / Drawer Control States
  const [detailArtist, setDetailArtist] = React.useState<ArtistItem | null>(null);
  const [verifyArtist, setVerifyArtist] = React.useState<ArtistItem | null>(null);
  const [statusConfirmArtist, setStatusConfirmArtist] = React.useState<ArtistItem | null>(null);

  // Verification Input Fields State
  const [verifyStatus, setVerifyStatus] = React.useState<"approved" | "rejected">("approved");
  const [verifyNotes, setVerifyNotes] = React.useState("");

  const fetchArtists = React.useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const queryParams = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });

      if (search) queryParams.append("search", search);
      if (statusFilter !== "all") queryParams.append("verification_status", statusFilter);

      const response = await api.get(`/admin/artists?${queryParams.toString()}`);
      const { success, data } = response.data;
      if (success && data) {
        setArtists(data.items || []);
        setTotal(data.total || 0);
      }
    } catch {
      toast.error("Failed to load artists directory.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, limit]);

  React.useEffect(() => {
    fetchArtists();
  }, [fetchArtists]);

  // Open verification dialog
  const handleOpenVerify = (artist: ArtistItem) => {
    setVerifyArtist(artist);
    setVerifyStatus("approved");
    setVerifyNotes("");
  };

  // Submit verification status change
  const handleSubmitVerify = async () => {
    if (!verifyArtist) return;
    try {
      const response = await api.put(`/admin/artists/${verifyArtist.id}/verify`, {
        verification_status: verifyStatus,
        verification_notes: verifyNotes,
      });
      if (response.data.success) {
        toast.success(`Verification status updated to: ${verifyStatus}`);
        setVerifyArtist(null);
        fetchArtists();
      }
    } catch {
      toast.error("Failed updating verification status.");
    }
  };

  // Toggle user activation credentials
  const handleToggleStatus = async () => {
    if (!statusConfirmArtist) return;
    try {
      const isSuspended = statusConfirmArtist.user.is_active;
      const endpoint = isSuspended ? "suspend" : "activate";
      const response = await api.put(`/admin/artists/${statusConfirmArtist.id}/${endpoint}`);
      if (response.data.success) {
        toast.success(isSuspended ? "Performer credentials suspended." : "Performer credentials activated.");
        setStatusConfirmArtist(null);
        fetchArtists();
      }
    } catch {
      toast.error("Failed updating performer status.");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminPageContainer
      title="Performer & Band Audits"
      description="Inspect artist media assets, verification documents, and audit login activity credentials."
    >
      {/* 1. Filtering toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-bg-card p-4 rounded-xl border border-border/80 mb-6 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <Input
            type="text"
            placeholder="Search performer name, bio keyword..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-text-secondary shrink-0">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Verify Status:</span>
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40 h-9 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Profiles</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 2. Reusable Table Listings */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Performer</TableHead>
                <TableHead>Genres / Category</TableHead>
                <TableHead>Base Rate</TableHead>
                <TableHead>Verify Status</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-xs text-text-muted">
                    Loading performer rosters from database...
                  </TableCell>
                </TableRow>
              ) : artists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-xs text-text-muted">
                    No performers matches.
                  </TableCell>
                </TableRow>
              ) : (
                artists.map((art) => (
                  <TableRow key={art.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[10px] font-bold text-white bg-primary">
                            {art.user.name?.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold text-text-primary text-xs">{art.user.name}</div>
                          <div className="text-[10px] text-text-secondary mt-0.5">{art.user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {art.genres?.slice(0, 2).map((g) => (
                          <Badge key={g.id} variant="secondary" className="text-[9px]">
                            {g.name}
                          </Badge>
                        ))}
                        {art.genres?.length > 2 && (
                          <span className="text-[9px] text-text-muted">+{art.genres.length - 2}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-text-primary text-xs">
                      {formatCurrency(art.base_rate)} / hr
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          art.verification_status === "approved"
                            ? "success"
                            : art.verification_status === "rejected"
                            ? "destructive"
                            : "outline"
                        }
                        className="text-[10px]"
                      >
                        {art.verification_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={art.user.is_active ? "success" : "destructive"} className="text-[10px]">
                        {art.user.is_active ? "Active" : "Suspended"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => setDetailArtist(art)}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-text-secondary hover:text-text-primary"
                          title="View Media & Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => handleOpenVerify(art)}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary hover:text-primary-hover"
                          title="Review Verification"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => setStatusConfirmArtist(art)}
                          variant="ghost"
                          size="icon"
                          className={art.user.is_active ? "h-7 w-7 text-warning" : "h-7 w-7 text-secondary"}
                          title={art.user.is_active ? "Suspend Performer" : "Activate Performer"}
                        >
                          <XCircle className="h-3.5 w-3.5" />
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

      {/* Pagination */}
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

      {/* 3. Sliding Detail Panel Drawer */}
      <Drawer
        open={!!detailArtist}
        onClose={() => setDetailArtist(null)}
        title="Performer Profile Audit Details"
        description="Comprehensive media assets documents and taxonomy checklist inspection."
      >
        {detailArtist && (
          <div className="space-y-6 text-xs text-text-secondary">
            {/* Header info */}
            <div className="flex items-center gap-4 bg-bg-card p-4 rounded-xl border border-border/50">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-sm font-bold text-white bg-primary">
                  {detailArtist.user.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-base font-bold text-text-primary">{detailArtist.user.name}</h4>
                <div className="flex items-center gap-1.5 text-text-secondary mt-1">
                  <span>Rating:</span>
                  <span className="font-bold text-accent">★ {detailArtist.rating}</span>
                </div>
              </div>
            </div>

            {/* Media Gallery / Videos / Documents */}
            <div className="space-y-4">
              {/* Documents */}
              <div className="space-y-2">
                <h5 className="font-bold text-text-primary uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>Verification Documents</span>
                </h5>
                {detailArtist.documents.length === 0 ? (
                  <p className="text-text-muted">No documents uploaded.</p>
                ) : (
                  <div className="space-y-1.5">
                    {detailArtist.documents.map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 bg-bg-card border border-border/50 rounded-lg hover:border-primary/50 transition-colors"
                      >
                        <span className="font-bold text-text-primary">{doc.title}</span>
                        <span className="text-[10px] text-primary hover:underline">Download Link</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Gallery Images */}
              <div className="space-y-2">
                <h5 className="font-bold text-text-primary uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-secondary" />
                  <span>Image Gallery</span>
                </h5>
                {detailArtist.gallery.length === 0 ? (
                  <p className="text-text-muted">No images in gallery.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {detailArtist.gallery.map((img: string, idx) => (
                      <div key={idx} className="relative aspect-video bg-bg-card border border-border/50 rounded overflow-hidden">
                        <Image src={img} alt="Gallery item" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
 
              {/* Video links */}
              <div className="space-y-2">
                <h5 className="font-bold text-text-primary uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <Video className="h-4 w-4 text-accent" />
                  <span>Performance Videos</span>
                </h5>
                {detailArtist.videos.length === 0 ? (
                  <p className="text-text-muted">No performance videos linked.</p>
                ) : (
                  <div className="space-y-1">
                    {detailArtist.videos.map((vid: string, idx) => (
                      <a
                        key={idx}
                        href={vid}
                        target="_blank"
                        rel="noreferrer"
                        className="block py-1.5 text-primary hover:underline truncate"
                      >
                        {vid}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Profile fields */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <h5 className="font-bold text-text-primary uppercase tracking-wider text-[10px]">Description & Genres</h5>
              <p className="leading-relaxed bg-bg-card p-3 rounded-lg border border-border/50 text-text-secondary">
                {detailArtist.bio || "No biography provided."}
              </p>
              
              <div className="flex flex-wrap gap-1.5 pt-2">
                {detailArtist.genres?.map((g) => (
                  <Badge key={g.id} variant="secondary">
                    {g.name}
                  </Badge>
                ))}
                {detailArtist.languages?.map((l) => (
                  <Badge key={l.id} variant="outline" className="text-secondary border-secondary/20">
                    {l.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Pricing details */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <h5 className="font-bold text-text-primary uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-primary" />
                <span>Pricing Breakdown</span>
              </h5>
              <div className="bg-bg-card p-3 rounded-lg border border-border/50 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-text-muted">Marketplace Rate</span>
                  <span className="text-text-primary font-bold">{formatCurrency(detailArtist.base_rate)} / hr</span>
                </div>
                {Object.entries(detailArtist.pricing_details).map(([key, val]) => (
                  <div key={key} className="flex justify-between capitalize">
                    <span className="text-text-muted">{key.replace(/_/g, " ")}</span>
                    <span className="text-text-primary font-semibold">
                      {typeof val === "number" ? formatCurrency(val) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* 4. Verification Form Dialog Overlay */}
      <Dialog open={!!verifyArtist} onOpenChange={() => setVerifyArtist(null)}>
        <DialogContent onClose={() => setVerifyArtist(null)}>
          <DialogHeader>
            <DialogTitle>Audit Verification Request</DialogTitle>
            <DialogDescription>
              Inspecting credentials application for: <span className="text-text-primary font-bold">{verifyArtist?.user.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-2">
              <Label>Action Decision</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 font-semibold text-text-primary cursor-pointer">
                  <input
                    type="radio"
                    name="verifyStatus"
                    value="approved"
                    checked={verifyStatus === "approved"}
                    onChange={() => setVerifyStatus("approved")}
                    className="accent-primary"
                  />
                  <span>Approve Profile</span>
                </label>
                <label className="flex items-center gap-2 font-semibold text-text-primary cursor-pointer">
                  <input
                    type="radio"
                    name="verifyStatus"
                    value="rejected"
                    checked={verifyStatus === "rejected"}
                    onChange={() => setVerifyStatus("rejected")}
                    className="accent-primary"
                  />
                  <span>Reject Profile</span>
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="verify_notes">Auditing notes (Sent to performer)</Label>
              <Textarea
                id="verify_notes"
                placeholder="Include verification details or contract guidelines..."
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setVerifyArtist(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitVerify}>
              Save Decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Account Suspension Confirm Dialogue */}
      <ConfirmDialog
        open={!!statusConfirmArtist}
        title={statusConfirmArtist?.user.is_active ? "Suspend Performer" : "Activate Performer"}
        description={`Are you sure you want to update login credentials activity state for: ${statusConfirmArtist?.user.name}?`}
        onConfirm={handleToggleStatus}
        onOpenChange={(isOpen) => !isOpen && setStatusConfirmArtist(null)}
      />
    </AdminPageContainer>
  );
}
