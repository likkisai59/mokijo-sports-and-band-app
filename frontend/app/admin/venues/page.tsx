"use client";

import * as React from "react";
import Image from "next/image";
import {
  Building,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  MapPin,
  Wrench,
  Clock
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
import { api } from "@/services/api";
import { formatCurrency } from "@/utils/format-currency";
import toast from "react-hot-toast";

interface VenueItem {
  id: string;
  user_id: string;
  user: {
    id: string;
    name: string;
    email: string;
    is_active: boolean;
  };
  name: string;
  description: string | null;
  address: string;
  city_id: string;
  city: {
    id: string;
    name: string;
  };
  base_price: number;
  capacity: number;
  verification_status: "pending" | "approved" | "rejected";
  verification_notes: string | null;
  facilities: string[];
  gallery: string[];
  pricing_details: Record<string, unknown>;
  availability_rules: Record<string, unknown>;
  categories: { id: string; name: string }[];
  created_at: string;
}

export default function AdminVenueManagementPage() {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(8);

  // Data States
  const [venues, setVenues] = React.useState<VenueItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // Modals / Drawer Control States
  const [detailVenue, setDetailVenue] = React.useState<VenueItem | null>(null);
  const [verifyVenue, setVerifyVenue] = React.useState<VenueItem | null>(null);
  const [statusConfirmVenue, setStatusConfirmVenue] = React.useState<VenueItem | null>(null);

  // Verification Input Fields State
  const [verifyStatus, setVerifyStatus] = React.useState<"approved" | "rejected">("approved");
  const [verifyNotes, setVerifyNotes] = React.useState("");

  const fetchVenues = React.useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const queryParams = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });

      if (search) queryParams.append("search", search);
      if (statusFilter !== "all") queryParams.append("verification_status", statusFilter);

      const response = await api.get(`/admin/venues?${queryParams.toString()}`);
      const { success, data } = response.data;
      if (success && data) {
        setVenues(data.items || []);
        setTotal(data.total || 0);
      }
    } catch {
      toast.error("Failed to load venues directory.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, limit]);

  React.useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  // Open verification dialog
  const handleOpenVerify = (venue: VenueItem) => {
    setVerifyVenue(venue);
    setVerifyStatus("approved");
    setVerifyNotes("");
  };

  // Submit verification status change
  const handleSubmitVerify = async () => {
    if (!verifyVenue) return;
    try {
      const response = await api.put(`/admin/venues/${verifyVenue.id}/verify`, {
        verification_status: verifyStatus,
        verification_notes: verifyNotes,
      });
      if (response.data.success) {
        toast.success(`Verification status updated to: ${verifyStatus}`);
        setVerifyVenue(null);
        fetchVenues();
      }
    } catch {
      toast.error("Failed updating verification status.");
    }
  };

  // Toggle user activation credentials
  const handleToggleStatus = async () => {
    if (!statusConfirmVenue) return;
    try {
      const isSuspended = statusConfirmVenue.user.is_active;
      const endpoint = isSuspended ? "suspend" : "activate";
      const response = await api.put(`/admin/venues/${statusConfirmVenue.id}/${endpoint}`);
      if (response.data.success) {
        toast.success(isSuspended ? "Venue owner credentials suspended." : "Venue owner credentials activated.");
        setStatusConfirmVenue(null);
        fetchVenues();
      }
    } catch {
      toast.error("Failed updating venue owner status.");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminPageContainer
      title="Event Space & Venue Audits"
      description="Inspect venue space profiles, check facilities lists, availability rules, and pricing details."
    >
      {/* 1. Filtering toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-bg-card p-4 rounded-xl border border-border/80 mb-6 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <Input
            type="text"
            placeholder="Search venue name, city..."
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
              <SelectItem value="all">All Spaces</SelectItem>
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
                <TableHead>Venue Space</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Capacity / Price</TableHead>
                <TableHead>Verify Status</TableHead>
                <TableHead>Owner Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-xs text-text-muted">
                    Loading venue directories from database...
                  </TableCell>
                </TableRow>
              ) : venues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-xs text-text-muted">
                    No venues matches.
                  </TableCell>
                </TableRow>
              ) : (
                venues.map((venue) => (
                  <TableRow key={venue.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-bg-primary rounded-lg border border-border">
                          <Building className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-bold text-text-primary text-xs">{venue.name}</div>
                          <div className="text-[10px] text-text-secondary mt-0.5">{venue.user.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {venue.city.name}
                    </TableCell>
                    <TableCell>
                      <div className="text-text-primary text-xs font-bold">{venue.capacity} Pax</div>
                      <div className="text-[10px] text-text-secondary mt-0.5">{formatCurrency(venue.base_price)} / event</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          venue.verification_status === "approved"
                            ? "success"
                            : venue.verification_status === "rejected"
                            ? "destructive"
                            : "outline"
                        }
                        className="text-[10px]"
                      >
                        {venue.verification_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={venue.user.is_active ? "success" : "destructive"} className="text-[10px]">
                        {venue.user.is_active ? "Active" : "Suspended"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => setDetailVenue(venue)}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-text-secondary hover:text-text-primary"
                          title="View Space Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => handleOpenVerify(venue)}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary hover:text-primary-hover"
                          title="Review Verification"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => setStatusConfirmVenue(venue)}
                          variant="ghost"
                          size="icon"
                          className={venue.user.is_active ? "h-7 w-7 text-warning" : "h-7 w-7 text-secondary"}
                          title={venue.user.is_active ? "Suspend Owner" : "Activate Owner"}
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
        open={!!detailVenue}
        onClose={() => setDetailVenue(null)}
        title="Venue Space Audit Details"
        description="Comprehensive facilities checklists pricing details and calendar availability rules inspection."
      >
        {detailVenue && (
          <div className="space-y-6 text-xs text-text-secondary">
            {/* Header info */}
            <div className="flex items-center gap-4 bg-bg-card p-4 rounded-xl border border-border/50">
              <div className="p-3 bg-primary/10 rounded-full border border-primary/20 text-primary">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-text-primary">{detailVenue.name}</h4>
                <div className="flex items-center gap-1 text-text-secondary mt-1">
                  <MapPin className="h-3.5 w-3.5 text-text-muted" />
                  <span>{detailVenue.city.name}</span>
                </div>
              </div>
            </div>

            {/* Photo Gallery Grid */}
            <div className="space-y-2">
              <h5 className="font-bold text-text-primary uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-secondary" />
                <span>Space Image Gallery</span>
              </h5>
              {detailVenue.gallery.length === 0 ? (
                <p className="text-text-muted">No images in gallery.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {detailVenue.gallery.map((img, idx) => (
                    <div key={idx} className="relative aspect-video bg-bg-card border border-border/50 rounded overflow-hidden">
                      <Image src={img} alt="Gallery space" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Facilities checklists */}
            <div className="space-y-2 pt-2">
              <h5 className="font-bold text-text-primary uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Wrench className="h-4 w-4 text-accent" />
                <span>On-Site Facilities</span>
              </h5>
              {detailVenue.facilities.length === 0 ? (
                <p className="text-text-muted">No facilities listed.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {detailVenue.facilities.map((fac, idx) => (
                    <Badge key={idx} variant="secondary" className="capitalize">
                      {fac.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <h5 className="font-bold text-text-primary uppercase tracking-wider text-[10px]">Description & Address</h5>
              <p className="leading-relaxed bg-bg-card p-3 rounded-lg border border-border/50 text-text-secondary">
                {detailVenue.description || "No description provided."}
              </p>
              <div className="flex items-start gap-1.5 text-text-muted">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{detailVenue.address}</span>
              </div>
            </div>

            {/* Pricing details */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <h5 className="font-bold text-text-primary uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-primary" />
                <span>Pricing Details</span>
              </h5>
              <div className="bg-bg-card p-3 rounded-lg border border-border/50 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-text-muted">Base Event Rent</span>
                  <span className="text-text-primary font-bold">{formatCurrency(detailVenue.base_price)}</span>
                </div>
                {Object.entries(detailVenue.pricing_details).map(([key, val]) => (
                  <div key={key} className="flex justify-between capitalize">
                    <span className="text-text-muted">{key.replace(/_/g, " ")}</span>
                    <span className="text-text-primary font-semibold">
                      {typeof val === "number" ? formatCurrency(val) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability details */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <h5 className="font-bold text-text-primary uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-secondary" />
                <span>Availability Calendar Rules</span>
              </h5>
              <div className="bg-bg-card p-3 rounded-lg border border-border/50 space-y-2">
                {Object.entries(detailVenue.availability_rules).map(([key, val]) => (
                  <div key={key} className="flex justify-between capitalize">
                    <span className="text-text-muted">{key.replace(/_/g, " ")}</span>
                    <span className="text-text-primary font-semibold">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* 4. Verification Form Dialog Overlay */}
      <Dialog open={!!verifyVenue} onOpenChange={() => setVerifyVenue(null)}>
        <DialogContent onClose={() => setVerifyVenue(null)}>
          <DialogHeader>
            <DialogTitle>Audit Space Verification</DialogTitle>
            <DialogDescription>
              Inspecting space application for: <span className="text-text-primary font-bold">{verifyVenue?.name}</span>
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
                  <span>Approve Venue</span>
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
                  <span>Reject Venue</span>
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="verify_notes">Auditing notes (Sent to space owner)</Label>
              <Textarea
                id="verify_notes"
                placeholder="Include safety verification logs, capacity notes or guidelines..."
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setVerifyVenue(null)}>
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
        open={!!statusConfirmVenue}
        title={statusConfirmVenue?.user.is_active ? "Suspend Venue Owner" : "Activate Venue Owner"}
        description={`Are you sure you want to update credentials active state for: ${statusConfirmVenue?.user.name}?`}
        onConfirm={handleToggleStatus}
        onOpenChange={(isOpen) => !isOpen && setStatusConfirmVenue(null)}
      />
    </AdminPageContainer>
  );
}
