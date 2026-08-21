"use client";

import * as React from "react";
import { 
  Trash2, 
  Plus, 
  Scale, 
  Gift,
  Building,
  Save,
  Globe,
  DollarSign
} from "lucide-react";
import toast from "react-hot-toast";

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee (INR)" },
  { code: "USD", symbol: "$", name: "US Dollar (USD)" },
  { code: "EUR", symbol: "€", name: "Euro (EUR)" },
  { code: "GBP", symbol: "£", name: "British Pound (GBP)" }
];

export function VenuePricing({ data, onSave }) {
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

  const [discounts, setDiscounts] = React.useState(data.discounts || []);
  const [saving, setSaving] = React.useState(false);

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

    const newItem = {
      name: newDiscName.trim(),
      type: newDiscType,
      value: Number(newDiscValue)
    };

    setDiscounts(prev => [...prev, newItem]);
    setNewDiscName("");
    setNewDiscValue(0);
    toast.success(`Discount "${newItem.name}" added!`);
  };

  const handleRemoveDiscount = (idx) => {
    setDiscounts(prev => {
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        width: "100%",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "24px 32px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
            <DollarSign style={{ width: "20px", height: "20px" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 900, color: "#0a0a0f", margin: 0, letterSpacing: "-0.01em" }}>
              Rental Pricing Packages &amp; Surcharges
            </h1>
            <p style={{ fontSize: "12.5px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
              Configure base rental tiers, package durations, cleaning fees, security deposits, and multi-day discounts.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 28px",
            borderRadius: "14px",
            backgroundColor: "#c6ff3d",
            color: "#0a0a0f",
            fontWeight: 900,
            fontSize: "14px",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(198, 255, 61, 0.4)",
            transition: "all 0.15s ease",
          }}
        >
          <Save style={{ width: "17px", height: "17px" }} />
          <span>{saving ? "Saving Pricing..." : "Save Pricing Rules"}</span>
        </button>
      </div>

      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.015)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Globe style={{ width: "18px", height: "18px", color: "#0a0a0f" }} />
          <div>
            <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#0a0a0f" }}>Display Currency</div>
            <div style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 500 }}>All client invoices, offers, and booking totals will be calculated in this unit.</div>
          </div>
        </div>

        <select
          value={currency}
          onChange={e => setCurrency(e.target.value)}
          style={{
            height: "40px",
            padding: "0 16px",
            borderRadius: "12px",
            backgroundColor: "#f8fafc",
            border: "1px solid #cbd5e1",
            fontSize: "13px",
            fontWeight: 800,
            color: "#0a0a0f",
            cursor: "pointer",
            outline: "none",
          }}
        >
          {CURRENCIES.map(curr => (
            <option key={curr.code} value={curr.code}>{curr.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            border: "1px solid #e2e8f0",
            padding: "24px 28px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
              <Building style={{ width: "16px", height: "16px" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
                Core Rates &amp; Duration Packages
              </h2>
              <p style={{ fontSize: "11.5px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>Base pricing for standard and extended venue slots.</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>Default Base Price (Single Full-Day Booking)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "11px", fontSize: "14px", fontWeight: 900, color: "#64748b" }}>{symbol}</span>
                <input
                  type="number"
                  value={basePrice}
                  onChange={e => setBasePrice(Number(e.target.value))}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 16px 0 38px",
                    borderRadius: "12px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#0a0a0f",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>Hourly Rate (For Rehearsals &amp; Short Gigs)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "11px", fontSize: "14px", fontWeight: 900, color: "#64748b" }}>{symbol}</span>
                <input
                  type="number"
                  value={hourlyPrice}
                  onChange={e => setHourlyPrice(Number(e.target.value))}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 16px 0 38px",
                    borderRadius: "12px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#0a0a0f",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>Half-Day Package (Up to 6 Hours)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "11px", fontSize: "14px", fontWeight: 900, color: "#64748b" }}>{symbol}</span>
                <input
                  type="number"
                  value={halfDayPrice}
                  onChange={e => setHalfDayPrice(Number(e.target.value))}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 16px 0 38px",
                    borderRadius: "12px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#0a0a0f",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: 800, color: "#1e293b" }}>Full-Day Package (Up to 12 Hours)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "14px", top: "11px", fontSize: "14px", fontWeight: 900, color: "#64748b" }}>{symbol}</span>
                <input
                  type="number"
                  value={fullDayPrice}
                  onChange={e => setFullDayPrice(Number(e.target.value))}
                  style={{
                    width: "100%",
                    height: "44px",
                    padding: "0 16px 0 38px",
                    borderRadius: "12px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#0a0a0f",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          border: "1px solid #e2e8f0",
          padding: "24px 32px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", color: "#c6ff3d" }}>
            <Gift style={{ width: "18px", height: "18px" }} />
          </div>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#0a0a0f", margin: 0 }}>
              Special Discount &amp; Promotional Programs
            </h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0", fontWeight: 500 }}>
              Create early-bird or multi-day discounts for performing artists and event organizers.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr)) 140px",
            gap: "14px",
            alignItems: "flex-end",
            backgroundColor: "#f8fafc",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", fontWeight: 800, color: "#1e293b" }}>Discount Name</label>
            <input
              placeholder="e.g. 3-Day Concert Bundle"
              value={newDiscName}
              onChange={e => setNewDiscName(e.target.value)}
              style={{
                height: "40px",
                padding: "0 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                fontSize: "13px",
                color: "#0a0a0f",
                fontWeight: 600,
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", fontWeight: 800, color: "#1e293b" }}>Discount Type</label>
            <select
              value={newDiscType}
              onChange={e => setNewDiscType(e.target.value)}
              style={{
                height: "40px",
                padding: "0 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                fontSize: "12.5px",
                color: "#0a0a0f",
                fontWeight: 700,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="percentage">Percentage Discount (%)</option>
              <option value="fixed">Flat Fixed Amount ({symbol})</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", fontWeight: 800, color: "#1e293b" }}>Discount Value</label>
            <input
              type="number"
              value={newDiscValue}
              onChange={e => setNewDiscValue(Number(e.target.value))}
              style={{
                height: "40px",
                padding: "0 14px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                fontSize: "13px",
                color: "#0a0a0f",
                fontWeight: 700,
                outline: "none",
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleAddDiscount}
            style={{
              height: "40px",
              padding: "0 18px",
              borderRadius: "10px",
              backgroundColor: "#0a0a0f",
              color: "#c6ff3d",
              fontWeight: 900,
              fontSize: "12.5px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <Plus style={{ width: "16px", height: "16px" }} />
            <span>Add Discount</span>
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
          {discounts.map((disc, idx) => (
            <div
              key={idx}
              style={{
                padding: "14px 16px",
                borderRadius: "14px",
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              }}
            >
              <div>
                <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#0a0a0f" }}>{disc.name}</div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#16a34a", marginTop: "2px" }}>
                  {disc.type === "percentage" ? `${disc.value}% OFF` : `${symbol} ${disc.value} FLAT OFF`}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveDiscount(idx)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#e11d48",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <Trash2 style={{ width: "16px", height: "16px" }} />
              </button>
            </div>
          ))}

          {discounts.length === 0 && (
            <div style={{ gridColumn: "1 / -1", padding: "24px", textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: "14px", color: "#94a3b8", fontSize: "12.5px", fontWeight: 600 }}>
              No custom discount plans configured yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
