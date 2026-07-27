"use client";

import * as React from "react";
import { PricingData, PackageItem, SpecialOfferItem } from "@/types/artist";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, DollarSign, Percent, Gift, Briefcase } from "lucide-react";
import toast from "react-hot-toast";

interface ArtistPricingProps {
  pricing: PricingData;
  onSave: (updated: PricingData) => Promise<void>;
}

export function ArtistPricing({ pricing, onSave }: ArtistPricingProps) {
  const [baseRate, setBaseRate] = React.useState(pricing.base_rate || 0);
  const [currency, setCurrency] = React.useState(pricing.currency || "INR");
  const [travelRadius, setTravelRadius] = React.useState(pricing.travel_radius || 0);
  const travelCharges = pricing.travel_charges || 0;
  const minHours = pricing.min_booking_hours || 0;
  const maxHours = pricing.max_booking_hours || 0;
  
  const [weekendSurcharge, setWeekendSurcharge] = React.useState(pricing.weekend_surcharge || 0);
  const [holidaySurcharge, setHolidaySurcharge] = React.useState(pricing.holiday_surcharge || 0);

  // Lists
  const [packages, setPackages] = React.useState<PackageItem[]>(pricing.packages || []);
  const [offers, setOffers] = React.useState<SpecialOfferItem[]>(pricing.special_offers || []);

  const [saving, setSaving] = React.useState(false);

  // Builders inputs
  const [pkgName, setPkgName] = React.useState("");
  const [pkgPrice, setPkgPrice] = React.useState(0);
  const [pkgDesc, setPkgDesc] = React.useState("");

  const [offTitle, setOffTitle] = React.useState("");
  const [offDiscount, setOffDiscount] = React.useState(0);
  const [offDesc, setOffDesc] = React.useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        base_rate: baseRate,
        currency,
        travel_radius: travelRadius,
        travel_charges: travelCharges,
        min_booking_hours: minHours,
        max_booking_hours: maxHours,
        weekend_surcharge: weekendSurcharge,
        holiday_surcharge: holidaySurcharge,
        packages,
        special_offers: offers
      });
      toast.success("Pricing configurations saved successfully!");
    } catch {
      toast.error("Failed to save pricing details.");
    } finally {
      setSaving(false);
    }
  };

  // Packages list methods
  const addPackage = () => {
    if (!pkgName.trim() || pkgPrice <= 0) {
      toast.error("Please enter a valid package name and price.");
      return;
    }
    const newItem: PackageItem = {
      name: pkgName.trim(),
      price: pkgPrice,
      description: pkgDesc.trim() || undefined
    };
    setPackages(prev => [...prev, newItem]);
    setPkgName("");
    setPkgPrice(0);
    setPkgDesc("");
    toast.success("Pricing package added!");
  };

  const removePackage = (idx: number) => {
    setPackages(prev => {
      const current = [...prev];
      current.splice(idx, 1);
      return current;
    });
  };

  // Special Offers list methods
  const addOffer = () => {
    if (!offTitle.trim() || offDiscount <= 0 || offDiscount > 100) {
      toast.error("Please enter a valid offer title and discount percentage (1-100).");
      return;
    }
    const newItem: SpecialOfferItem = {
      title: offTitle.trim(),
      discount: offDiscount,
      description: offDesc.trim() || undefined
    };
    setOffers(prev => [...prev, newItem]);
    setOffTitle("");
    setOffDiscount(0);
    setOffDesc("");
    toast.success("Promo offer added!");
  };

  const removeOffer = (idx: number) => {
    setOffers(prev => {
      const current = [...prev];
      current.splice(idx, 1);
      return current;
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      
      {/* Basic limits row */}
      <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 shadow-xl">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <DollarSign className="h-4.5 w-4.5 text-primary" />
            Standard Performer Rates
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency Code</Label>
              <select
                id="currency"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-bg-card text-text-primary text-xs"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="base_rate">Performance Rate (INR)</Label>
              <Input
                id="base_rate"
                type="number"
                value={baseRate}
                onChange={e => setBaseRate(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="travel_radius">Travel Radius (km)</Label>
              <Input
                id="travel_radius"
                type="number"
                value={travelRadius}
                onChange={e => setTravelRadius(Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Surcharge Adjustments */}
      <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 shadow-xl">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Percent className="h-4.5 w-4.5 text-primary" />
            Special Day Surcharges (%)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="weekend_surcharge">Weekend Booking Surcharge (%)</Label>
              <Input
                id="weekend_surcharge"
                type="number"
                placeholder="E.g. 15 for 15% increase"
                value={weekendSurcharge}
                onChange={e => setWeekendSurcharge(Number(e.target.value))}
              />
              <span className="text-[10px] text-text-muted">Applied to events falling on Saturdays or Sundays.</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="holiday_surcharge">Festival / Holiday Surcharge (%)</Label>
              <Input
                id="holiday_surcharge"
                type="number"
                placeholder="E.g. 25 for 25% increase"
                value={holidaySurcharge}
                onChange={e => setHolidaySurcharge(Number(e.target.value))}
              />
              <span className="text-[10px] text-text-muted">Applied to events falling on calendar holidays.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Packages list builder */}
      <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 shadow-xl">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Briefcase className="h-4.5 w-4.5 text-primary" />
            Standard Gig Packages
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="p-4 border border-border/60 bg-bg-elevated/10 rounded-2xl space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Package Title</Label>
                <Input 
                  placeholder="E.g. Full Concert Setup" 
                  value={pkgName}
                  onChange={e => setPkgName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Flat Price ({currency})</Label>
                <Input 
                  type="number" 
                  value={pkgPrice}
                  onChange={e => setPkgPrice(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Package Description (Services, Equipments, Duration)</Label>
              <Textarea 
                rows={2} 
                placeholder="E.g. Includes 3 hours performance, sound mixer, 4 mics, and lighting setup." 
                value={pkgDesc}
                onChange={e => setPkgDesc(e.target.value)}
              />
            </div>
            <Button type="button" onClick={addPackage} className="bg-primary text-white h-9 px-4">
              <Plus className="h-4 w-4 mr-1" /> Add Package Option
            </Button>
          </div>

          {/* Render List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {packages.map((pkg, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-border bg-bg-elevated/25 flex flex-col justify-between relative group">
                <button
                  type="button"
                  onClick={() => removePackage(idx)}
                  className="absolute top-2 right-2 p-1 text-error hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-text-primary block">{pkg.name}</span>
                  <span className="text-sm font-black text-primary block">
                    {currency} {pkg.price.toLocaleString()}
                  </span>
                  {pkg.description && (
                    <p className="text-[11px] text-text-secondary leading-relaxed pt-1.5 border-t border-border/40 mt-1">
                      {pkg.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {packages.length === 0 && (
              <p className="text-xs text-text-muted italic">No custom gig packages created yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Special Offers (placeholder list builder) */}
      <Card className="bg-bg-card/45 backdrop-blur-md border border-border/80 shadow-xl">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Gift className="h-4.5 w-4.5 text-primary" />
            Special Offers & Promos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="p-4 border border-border/60 bg-bg-elevated/10 rounded-2xl space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Promo Name</Label>
                <Input 
                  placeholder="E.g. Early Bird Booking Discount" 
                  value={offTitle}
                  onChange={e => setOffTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Discount (%)</Label>
                <Input 
                  type="number" 
                  value={offDiscount}
                  onChange={e => setOffDiscount(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Discount Terms / Code Description</Label>
              <Textarea 
                rows={2} 
                placeholder="E.g. 10% off for all shows booked at least 3 months in advance of the gig date." 
                value={offDesc}
                onChange={e => setOffDesc(e.target.value)}
              />
            </div>
            <Button type="button" onClick={addOffer} className="bg-primary text-white h-9 px-4">
              <Plus className="h-4 w-4 mr-1" /> Add Promo Offer
            </Button>
          </div>

          {/* Render List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {offers.map((off, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-border bg-bg-elevated/25 flex flex-col justify-between relative group">
                <button
                  type="button"
                  onClick={() => removeOffer(idx)}
                  className="absolute top-2 right-2 p-1 text-error hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-text-primary block">{off.title}</span>
                  <span className="text-xs font-black text-amber-400 block">
                    {off.discount}% OFF Booking Rate
                  </span>
                  {off.description && (
                    <p className="text-[11px] text-text-secondary leading-relaxed pt-1.5 border-t border-border/40 mt-1">
                      {off.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {offers.length === 0 && (
              <p className="text-xs text-text-muted italic">No promo discount codes created yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={saving}
        className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 flex items-center justify-center gap-2"
      >
        <Save className="h-4 w-4" />
        <span>{saving ? "Saving Configurations..." : "Save Pricing Configurations"}</span>
      </Button>

    </form>
  );
}
