"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Globe,
  Milestone,
  Building,
  Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AdminPageContainer } from "@/components/layout/admin/AdminPageContainer";
import { api } from "@/services/api";
import toast from "react-hot-toast";

interface AreaItem {
  id: string;
  name: string;
  pincode: string;
  city_id: string;
  city_name: string;
  state_name: string;
  country_name: string;
  latitude: number | null;
  longitude: number | null;
  service_radius: number;
}

// Zod schemas for forms validation
const areaFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  pincode: z.string().min(4, "Pincode must be at least 4 characters"),
  city_id: z.string().uuid("Please select a valid city"),
  latitude: z.preprocess((val) => (val === "" ? undefined : Number(val)), z.number().optional()),
  longitude: z.preprocess((val) => (val === "" ? undefined : Number(val)), z.number().optional()),
  service_radius: z.preprocess((val) => Number(val), z.number().min(1, "Radius must be at least 1km")),
});

type AreaFormData = z.infer<typeof areaFormSchema>;

export default function LocationManagementPage() {
  const [activeTab, setActiveTab] = React.useState("areas_list"); // areas_list, add_hierarchy
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(10);

  // Data Lists State
  const [areas, setAreas] = React.useState<AreaItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // Dropdown options lists
  const [countries, setCountries] = React.useState<{ id: string; name: string }[]>([]);
  const [states, setStates] = React.useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = React.useState<{ id: string; name: string }[]>([]);

  // Add Hierarchy Input Values State
  const [selectedCountryId, setSelectedCountryId] = React.useState("");
  const [selectedStateId, setSelectedStateId] = React.useState("");
  
  const [newCountryName, setNewCountryName] = React.useState("");
  const [newCountryCode, setNewCountryCode] = React.useState("");
  const [newStateName, setNewStateName] = React.useState("");
  const [newCityName, setNewCityName] = React.useState("");

  // Modals Toggles
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingArea, setEditingArea] = React.useState<AreaItem | null>(null);
  const [deleteConfirmArea, setDeleteConfirmArea] = React.useState<AreaItem | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AreaFormData>({
    resolver: zodResolver(areaFormSchema),
  });

  // Fetch areas lists
  const fetchAreas = React.useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const queryParams = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });

      if (search) queryParams.append("search", search);

      const response = await api.get(`/locations/areas?${queryParams.toString()}`);
      const { success, data } = response.data;
      if (success && data) {
        setAreas(data.items || []);
        setTotal(data.total || 0);
      }
    } catch {
      toast.error("Failed to load areas.");
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  // Load dropdown categories hierarchy
  const loadHierarchyData = React.useCallback(async () => {
    try {
      const cRes = await api.get("/locations/countries");
      if (cRes.data.success) setCountries(cRes.data.data);
    } catch {
      console.error("Failed loading countries.");
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === "areas_list") {
      fetchAreas();
    }
    loadHierarchyData();
  }, [activeTab, fetchAreas, loadHierarchyData]);

  // Load states based on country
  const handleCountrySelect = async (countryId: string) => {
    setSelectedCountryId(countryId);
    setSelectedStateId("");
    setCities([]);
    try {
      const sRes = await api.get(`/locations/states?country_id=${countryId}`);
      if (sRes.data.success) setStates(sRes.data.data);
    } catch {
      toast.error("Failed loading states.");
    }
  };

  // Load cities based on state
  const handleStateSelect = async (stateId: string) => {
    setSelectedStateId(stateId);
    try {
      const cRes = await api.get(`/locations/cities?state_id=${stateId}`);
      if (cRes.data.success) setCities(cRes.data.data);
    } catch {
      toast.error("Failed loading cities.");
    }
  };

  // Form submit handles
  const handleAddCountry = async () => {
    if (!newCountryName || !newCountryCode) {
      toast.error("Country name and code are required.");
      return;
    }
    try {
      const response = await api.post("/locations/countries", {
        name: newCountryName,
        code: newCountryCode,
      });
      if (response.data.success) {
        toast.success("Country registered successfully.");
        setNewCountryName("");
        setNewCountryCode("");
        loadHierarchyData();
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed registering country.");
    }
  };

  const handleAddState = async () => {
    if (!newStateName || !selectedCountryId) {
      toast.error("State name and parent country are required.");
      return;
    }
    try {
      const response = await api.post("/locations/states", {
        name: newStateName,
        country_id: selectedCountryId,
      });
      if (response.data.success) {
        toast.success("State registered successfully.");
        setNewStateName("");
        handleCountrySelect(selectedCountryId);
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed registering state.");
    }
  };

  const handleAddCity = async () => {
    if (!newCityName || !selectedStateId) {
      toast.error("City name and parent state are required.");
      return;
    }
    try {
      const response = await api.post("/locations/cities", {
        name: newCityName,
        state_id: selectedStateId,
      });
      if (response.data.success) {
        toast.success("City registered successfully.");
        setNewCityName("");
        handleStateSelect(selectedStateId);
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed registering city.");
    }
  };

  // Edit / Add Area dialog
  const handleOpenCreateArea = () => {
    setEditingArea(null);
    reset({
      name: "",
      pincode: "",
      city_id: "",
      latitude: undefined,
      longitude: undefined,
      service_radius: 50,
    });
    setFormDialogOpen(true);
  };

  const handleOpenEditArea = (area: AreaItem) => {
    setEditingArea(area);
    reset({
      name: area.name,
      pincode: area.pincode,
      city_id: area.city_id,
      latitude: area.latitude ?? undefined,
      longitude: area.longitude ?? undefined,
      service_radius: area.service_radius,
    });
    // Prime the selects
    setValue("city_id", area.city_id);
    setFormDialogOpen(true);
  };

  const onSubmitArea = async (data: AreaFormData) => {
    try {
      if (editingArea) {
        const response = await api.put(`/locations/areas/${editingArea.id}`, data);
        if (response.data.success) {
          toast.success("Area details updated successfully!");
          setFormDialogOpen(false);
          fetchAreas();
        }
      } else {
        const response = await api.post("/locations/areas", data);
        if (response.data.success) {
          toast.success("Area registered successfully!");
          setFormDialogOpen(false);
          fetchAreas();
        }
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to save area.");
    }
  };

  const handleDeleteArea = async () => {
    if (!deleteConfirmArea) return;
    try {
      const response = await api.delete(`/locations/areas/${deleteConfirmArea.id}`);
      if (response.data.success) {
        toast.success("Area successfully deleted.");
        setDeleteConfirmArea(null);
        fetchAreas();
      }
    } catch {
      toast.error("Failed to delete area.");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminPageContainer
      title="Geographical Location Console"
      description="Manage operations service areas radius limits, postal codes matching, and cities hierarchies."
      actions={
        <div className="flex gap-2">
          <Button
            onClick={() => setActiveTab(activeTab === "areas_list" ? "add_hierarchy" : "areas_list")}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1.5 font-bold"
          >
            <Compass className="h-4 w-4" />
            <span>{activeTab === "areas_list" ? "Taxonomy Hierarchy" : "View Areas List"}</span>
          </Button>
          <Button onClick={handleOpenCreateArea} size="sm" className="flex items-center gap-1.5 font-bold">
            <Plus className="h-4 w-4" />
            <span>Register Area</span>
          </Button>
        </div>
      }
    >
      {/* ─── TAB 1: AREAS DIRECTORY TABLE ───────────────────────────────────── */}
      {activeTab === "areas_list" && (
        <div className="space-y-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <Input
              type="text"
              placeholder="Search area name, pincode..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-9 text-xs"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area / Pincode</TableHead>
                    <TableHead>Parent Hierarchy</TableHead>
                    <TableHead>Coordinates</TableHead>
                    <TableHead>Service Radius</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-28 text-center text-xs text-text-muted">
                        Loading geographical parameters from database...
                      </TableCell>
                    </TableRow>
                  ) : areas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-28 text-center text-xs text-text-muted">
                        No operations areas matches.
                      </TableCell>
                    </TableRow>
                  ) : (
                    areas.map((area) => (
                      <TableRow key={area.id}>
                        <TableCell>
                          <div className="font-bold text-text-primary text-xs">{area.name}</div>
                          <div className="text-[10px] text-text-secondary mt-0.5 font-mono">{area.pincode}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {area.city_name}, {area.state_name} • {area.country_name}
                        </TableCell>
                        <TableCell className="text-text-secondary text-xs font-mono text-[10px]">
                          {area.latitude && area.longitude ? (
                            <span>{area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}</span>
                          ) : (
                            <span className="text-text-muted">Not specified</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="secondary" className="font-bold">
                            {area.service_radius} km
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => handleOpenEditArea(area)}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-text-secondary hover:text-text-primary"
                              title="Edit Area details"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              onClick={() => setDeleteConfirmArea(area)}
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              title="Delete Area"
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
        </div>
      )}

      {/* ─── TAB 2: GEOGRAPHICAL HIERARCHY REGISTRATION ────────────────────────── */}
      {activeTab === "add_hierarchy" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Add Country */}
          <Card>
            <CardHeader className="border-b border-border/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Globe className="h-4.5 w-4.5 text-primary" />
                <span>Register Country</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="space-y-1">
                <Label htmlFor="country_name">Country Name</Label>
                <Input
                  id="country_name"
                  placeholder="e.g. India"
                  value={newCountryName}
                  onChange={(e) => setNewCountryName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="country_code">Country ISO Code</Label>
                <Input
                  id="country_code"
                  placeholder="e.g. IN"
                  value={newCountryCode}
                  onChange={(e) => setNewCountryCode(e.target.value)}
                />
              </div>
              <Button onClick={handleAddCountry} className="w-full font-bold h-9">
                Save Country
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Add State */}
          <Card>
            <CardHeader className="border-b border-border/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Milestone className="h-4.5 w-4.5 text-secondary" />
                <span>Register State</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="space-y-1">
                <Label>Parent Country</Label>
                <Select value={selectedCountryId} onValueChange={handleCountrySelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="state_name">State Name</Label>
                <Input
                  id="state_name"
                  placeholder="e.g. Karnataka"
                  value={newStateName}
                  onChange={(e) => setNewStateName(e.target.value)}
                />
              </div>
              <Button onClick={handleAddState} className="w-full font-bold h-9">
                Save State
              </Button>
            </CardContent>
          </Card>

          {/* Card 3: Add City */}
          <Card>
            <CardHeader className="border-b border-border/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Building className="h-4.5 w-4.5 text-accent" />
                <span>Register City</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="space-y-1">
                <Label>Parent Country</Label>
                <Select value={selectedCountryId} onValueChange={handleCountrySelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Parent State</Label>
                <Select value={selectedStateId} onValueChange={handleStateSelect}>
                  <SelectTrigger className="w-full" disabled={!selectedCountryId}>
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="city_name">City Name</Label>
                <Input
                  id="city_name"
                  placeholder="e.g. Bengaluru"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                />
              </div>
              <Button onClick={handleAddCity} className="w-full font-bold h-9">
                Save City
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── MODAL 1: REGISTER / EDIT AREA DIALOG ──────────────────────────────── */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent onClose={() => setFormDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingArea ? "Edit Area Details" : "Register Operating Area"}</DialogTitle>
            <DialogDescription>
              Create geographical listings matching coordinate calculations
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitArea)} className="space-y-4 py-4 text-xs">
            <div className="space-y-1">
              <Label>Select Country</Label>
              <Select value={selectedCountryId} onValueChange={handleCountrySelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Select State</Label>
              <Select value={selectedStateId} onValueChange={handleStateSelect}>
                <SelectTrigger className="w-full" disabled={!selectedCountryId}>
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Select City</Label>
              <Select
                value={editingArea?.city_id || undefined}
                onValueChange={(val) => setValue("city_id", val)}
              >
                <SelectTrigger className="w-full" disabled={!selectedStateId}>
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.city_id && (
                <p className="text-xs text-error font-medium mt-1">{errors.city_id.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="area_name">Area Name</Label>
                <Input id="area_name" placeholder="e.g. Indiranagar" disabled={isSubmitting} {...register("name")} />
                {errors.name && <p className="text-xs text-error font-medium mt-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="area_pincode">Pincode</Label>
                <Input id="area_pincode" placeholder="e.g. 560038" disabled={isSubmitting} {...register("pincode")} />
                {errors.pincode && <p className="text-xs text-error font-medium mt-1">{errors.pincode.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="latitude">Latitude (Opt)</Label>
                <Input id="latitude" type="number" step="any" placeholder="12.9716" disabled={isSubmitting} {...register("latitude")} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="longitude">Longitude (Opt)</Label>
                <Input id="longitude" type="number" step="any" placeholder="77.5946" disabled={isSubmitting} {...register("longitude")} />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="service_radius">Service Radius (km)</Label>
              <Input
                id="service_radius"
                type="number"
                disabled={isSubmitting}
                {...register("service_radius")}
              />
              {errors.service_radius && (
                <p className="text-xs text-error font-medium mt-1">{errors.service_radius.message}</p>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setFormDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Area"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 2: CONFIRM DELETION WARNING ─────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteConfirmArea}
        title="Confirm Area Deletion"
        description={`Are you sure you want to delete ${deleteConfirmArea?.name}? this soft-deletes the operations area.`}
        onConfirm={handleDeleteArea}
        onOpenChange={(isOpen) => !isOpen && setDeleteConfirmArea(null)}
      />
    </AdminPageContainer>
  );
}
