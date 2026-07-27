"use client";

import * as React from "react";
import { VenuePricingData, VenueDiscountData } from "@/types/venue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  Plus, 
  Scale, 
  Gift,
  Building,
  Save
} from "lucide-react";
import toast from "react-hot-toast";

interface VenuePricingProps {
  data: VenuePricingData;
  onSave: (updated: VenuePricingData) => Promise<void>;
}

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee (INR)" },
  { code: "USD", symbol: "$", name: "US Dollar (USD)" },
  { code: "EUR", symbol: "€", name: "Euro (EUR)" },
  { code: "GBP", symbol: "£", name: "British Pound (GBP)" }
];

export function VenuePricing({ data, onSave }: VenuePricingProps) {
  const [currency, setCurrency] = React.useState(data.currency || "INR");
  const [basePrice, setBasePrice] = React.useState(data.base_price || 0);
  const [hourlyPrice, setHourlyPrice] = React.useState(data.hourly_price || 0);
  const [halfDayPrice, setHalfDayPrice] = React.useState(data.half_day_price || 0);
  const [fullDayPrice, setFullDayPrice] = React.useState(data.full_day_price || 0);

  const [weekendPrice, setWeekendPrice] = React.useState(data.weekend_price || 0);
  const [holidayPrice, setHolidayPrice] = React.useState(data.holiday_price || 0);
  const [securityDeposit, setSecurityDeposit] = React.useState(data.security_deposit || 0);
  const [cleaningCharges, setCleaningCharges] = React.useState(data.cleaning_charges || 0);
  const [cancellationCharges, setCancellationCharges] = React.useState(data.cancellation_charges || 0);
  const [taxPercentage, setTaxPercentage] = React.useState(data.tax_percentage || 0);

  const [discounts, setDiscounts] = React.useState<VenueDiscountData[]>(data.discounts || []);

  const [saving, setSaving] = React.useState(false);

  // New discount inputs
  const [newDiscName, setNewDiscName] = React.useState("");
  const [newDiscType, setNewDiscType] = React.useState("percentage");
  const [newDiscValue, setNewDiscValue] = React.useState(0);

  const selectedCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  const symbol = selectedCurrency.symbol;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        currency,
        base_price: Number(basePrice),
        hourly_price: Number(hourlyPrice),
        half_day_price: Number(halfDayPrice),
        full_day_price: Number(fullDayPrice),
        weekend_price: Number(weekendPrice),
        holiday_price: Number(holidayPrice),
        security_deposit: Number(securityDeposit),
        cleaning_charges: Number(cleaningCharges),
        cancellation_charges: Number(cancellationCharges),
        tax_percentage: Number(taxPercentage),
        discounts
      });
      toast.success("Venue pricing rules saved successfully!");
    } catch {
      toast.error("Failed to save pricing configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddDiscount = () => {
    if (!newDiscName.trim()) {
      toast.error("Discount program name is required.");
      return;
    }
    if (newDiscValue <= 0) {
      toast.error("Discount value must be greater than zero.");
      return;
    }
    if (newDiscType === "percentage" && newDiscValue > 100) {
      toast.error("Percentage discount cannot exceed 100%.");
      return;
    }

    const newItem: VenueDiscountData = {
      name: newDiscName.trim(),
      type: newDiscType,
      value: Number(newDiscValue)
    };

    setDiscounts(prev => [...prev, newItem]);
    setNewDiscName("");
    setNewDiscValue(0);
    toast.success(`Discount "${newItem.name}" added!`);
  };

  const handleRemoveDiscount = (idx: number) => {
    setDiscounts(prev => {
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });
  };

  return (
    <div className="space-y-8 bg-bg-card/45 backdrop-blur-md border border-border/80 p-6 md:p-8 rounded-3xl shadow-xl">
      
      {/* Title */}
      <div className="border-b border-border/50 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold text-text-primary">Rental Pricing Packages & Modifiers</h2>
          <p className="text-xs text-text-secondary">Configure base rental rates, multi-hour package discounts, security deposits, and taxes.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="bg-primary hover:bg-primary/95 text-white font-bold h-10 px-6 flex items-center gap-1.5 self-start sm:self-center"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? "Saving Pricing..." : "Save Pricing Rules"}</span>
        </Button>
      </div>

      {/* Currency Support Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-4 border border-border/60 bg-bg-elevated/15 rounded-2xl">
        <div className="md:col-span-2 space-y-1">
          <Label className="text-xs font-bold text-text-primary flex items-center gap-2">
            <GlobeIcon className="h-4 w-4 text-primary" />
            Pricing Currency
          </Label>
          <p className="text-[10px] text-text-secondary">Choose the currency display unit for all booking offers and invoices.</p>
        </div>
        <select 
          value={currency} 
          onChange={e => setCurrency(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-border bg-bg-card text-text-primary text-xs font-bold"
        >
          {CURRENCIES.map(curr => (
            <option key={curr.code} value={curr.code}>{curr.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Standard Core Packages */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Building className="h-4.5 w-4.5 text-primary" />
            Core Rates Packages
          </h3>

          <Card className="bg-bg-card/45 border border-border/80 rounded-2xl shadow">
            <CardContent className="p-5 space-y-4">
              
              <div className="space-y-1.5">
                <Label htmlFor="base_price">Default Base Price (Single Day Rent)</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-text-muted font-bold">{symbol}</span>
                  <Input 
                    id="base_price" 
                    type="number"
                    value={basePrice}
                    onChange={e => setBasePrice(Number(e.target.value))}
                    className="pl-9 h-9.5 text-xs font-bold text-text-primary" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hourly_price">Hourly Rate (Short Events)</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-text-muted font-bold">{symbol}</span>
                  <Input 
                    id="hourly_price" 
                    type="number"
                    value={hourlyPrice}
                    onChange={e => setHourlyPrice(Number(e.target.value))}
                    className="pl-9 h-9.5 text-xs font-bold text-text-primary" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="half_day_price">Half-Day Package (Up to 6 Hours)</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-text-muted font-bold">{symbol}</span>
                  <Input 
                    id="half_day_price" 
                    type="number"
                    value={halfDayPrice}
                    onChange={e => setHalfDayPrice(Number(e.target.value))}
                    className="pl-9 h-9.5 text-xs font-bold text-text-primary" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="full_day_price">Full-Day Package (Up to 12 Hours)</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-text-muted font-bold">{symbol}</span>
                  <Input 
                    id="full_day_price" 
                    type="number"
                    value={fullDayPrice}
                    onChange={e => setFullDayPrice(Number(e.target.value))}
                    className="pl-9 h-9.5 text-xs font-bold text-text-primary" 
                  />
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Right Column: Pricing Surcharges & Modifiers */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Scale className="h-4.5 w-4.5 text-primary" />
            Modifiers & Surcharges
          </h3>

          <Card className="bg-bg-card/45 border border-border/80 rounded-2xl shadow">
            <CardContent className="p-5 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="weekend_price">Weekend Premium (%)</Label>
                  <div className="relative">
                    <span className="absolute right-3.5 top-2.5 text-xs text-text-muted font-bold">%</span>
                    <Input 
                      id="weekend_price" 
                      type="number"
                      value={weekendPrice}
                      onChange={e => setWeekendPrice(Number(e.target.value))}
                      className="pr-9 h-9.5 text-xs font-bold text-text-primary" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="holiday_price">Holiday Surcharge (%)</Label>
                  <div className="relative">
                    <span className="absolute right-3.5 top-2.5 text-xs text-text-muted font-bold">%</span>
                    <Input 
                      id="holiday_price" 
                      type="number"
                      value={holidayPrice}
                      onChange={e => setHolidayPrice(Number(e.target.value))}
                      className="pr-9 h-9.5 text-xs font-bold text-text-primary" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="security_deposit">Security Caution Deposit (Refundable)</Label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-text-muted font-bold">{symbol}</span>
                  <Input 
                    id="security_deposit" 
                    type="number"
                    value={securityDeposit}
                    onChange={e => setSecurityDeposit(Number(e.target.value))}
                    className="pl-9 h-9.5 text-xs font-bold text-text-primary" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cleaning_charges">Cleaning Charges</Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-text-muted font-bold">{symbol}</span>
                    <Input 
                      id="cleaning_charges" 
                      type="number"
                      value={cleaningCharges}
                      onChange={e => setCleaningCharges(Number(e.target.value))}
                      className="pl-9 h-9.5 text-xs font-bold text-text-primary" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cancellation_charges">Cancellation Fee (%)</Label>
                  <div className="relative">
                    <span className="absolute right-3.5 top-2.5 text-xs text-text-muted font-bold">%</span>
                    <Input 
                      id="cancellation_charges" 
                      type="number"
                      value={cancellationCharges}
                      onChange={e => setCancellationCharges(Number(e.target.value))}
                      className="pr-9 h-9.5 text-xs font-bold text-text-primary" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tax_percentage">Local GST / Tax Percentage (%)</Label>
                <div className="relative">
                  <span className="absolute right-3.5 top-2.5 text-xs text-text-muted font-bold">%</span>
                  <Input 
                    id="tax_percentage" 
                    type="number"
                    value={taxPercentage}
                    onChange={e => setTaxPercentage(Number(e.target.value))}
                    className="pr-9 h-9.5 text-xs font-bold text-text-primary" 
                  />
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>

      {/* DISCOUNTS BUILDER SECTION */}
      <div className="pt-6 border-t border-border/50 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Gift className="h-4.5 w-4.5 text-primary" />
            Promo Discounts Manager
          </h3>
          <p className="text-[11px] text-text-secondary">Configure early bird discounts, off-season rates, or corporate package deals.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border border-border/60 bg-bg-elevated/15 rounded-2xl">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="disc_name">Discount Program Title</Label>
            <Input 
              id="disc_name" 
              placeholder="e.g. Weekday Early Bird Deal" 
              value={newDiscName}
              onChange={e => setNewDiscName(e.target.value)}
              className="h-9.5 text-xs"
            />
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <Label>Type</Label>
            <select
              value={newDiscType}
              onChange={e => setNewDiscType(e.target.value)}
              className="w-full h-9.5 px-3 rounded-lg border border-border bg-bg-card text-text-primary text-xs"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat Value ({symbol})</option>
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <Label htmlFor="disc_val">Discount Value</Label>
            <div className="relative">
              <span className="absolute right-3.5 top-2.5 text-xs text-text-muted">{newDiscType === "percentage" ? "%" : symbol}</span>
              <Input 
                id="disc_val" 
                type="number"
                value={newDiscValue}
                onChange={e => setNewDiscValue(Number(e.target.value))}
                className="pr-9 h-9.5 text-xs font-bold"
              />
            </div>
          </div>

          <Button type="button" onClick={handleAddDiscount} className="bg-primary text-white h-9.5 font-bold flex items-center justify-center gap-1 md:col-span-4">
            <Plus className="h-4 w-4" />
            <span>Register Discount Offer</span>
          </Button>
        </div>

        {/* Active discounts tags list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
          {discounts.map((disc, idx) => (
            <div key={idx} className="p-3.5 border border-border bg-bg-card/80 rounded-2xl flex items-start justify-between relative group shadow">
              <div className="space-y-1">
                <Badge className="bg-primary/10 text-primary border border-primary/20 text-[9px] py-0.5 uppercase font-bold">
                  Active Promo
                </Badge>
                <p className="text-xs font-bold text-text-primary">{disc.name}</p>
                <p className="text-sm font-black text-text-primary pt-1">
                  {disc.type === "percentage" ? `-${disc.value}%` : `-${symbol}${disc.value}`}
                </p>
              </div>

              <button 
                type="button"
                onClick={() => handleRemoveDiscount(idx)}
                className="text-error hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {discounts.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-text-muted italic border border-dashed border-border rounded-xl">
              No custom promo discounts registered yet.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// Inline helper icon since Globe is not imported
function GlobeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
