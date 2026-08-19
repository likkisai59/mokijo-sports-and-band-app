"use client";

import { API_BASE_URL } from "@/lib/api";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, User, Mail, Phone, Shield, Users, CheckCircle2, AlertCircle } from "lucide-react";

export default function EditMemberPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Player");
  const [groupName, setGroupName] = useState("");

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  // Roles matching the system's standard roles
  const roles = ["Player", "Coach", "Parent", "Referee", "Captain"];

  useEffect(() => {
    const fetchMember = async () => {
      const ownerId = localStorage.getItem("userId");
      if (!ownerId) {
        setError("Please sign in again to edit this member.");
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch(`${API_BASE_URL}/members/${id}?owner_id=${ownerId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (response.ok) {
          const data = await response.json();
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
          setRole(data.role || "Player");
          setGroupName(data.group_name || "No Group");
        } else {
          setError("Failed to retrieve member details. It might have been deleted.");
        }
      } catch (err) {
        console.error("Error fetching member:", err);
        setError("Could not connect to the backend server. Please verify it is running.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMember();
    }
  }, [id]);

  const handleUpdateMember = async (e) => {
    e.preventDefault();

    if (!firstName.trim()) {
      alert("First Name is required");
      return;
    }
    if (!lastName.trim()) {
      alert("Last Name is required");
      return;
    }
    if (!email.trim()) {
      alert("Email is required");
      return;
    }
    if (!phone.trim()) {
      alert("Phone number is required");
      return;
    }

    const ownerId = localStorage.getItem("userId");
    if (!ownerId) {
      setError("Please sign in again to update this member.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const updatedData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: role,
    };

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/members/${id}?owner_id=${ownerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setError(errData.detail || "Failed to update member.");
        setIsSubmitting(false);
        return;
      }

      setShowSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/members");
      }, 1500);
    } catch (err) {
      console.error("Error updating member:", err);
      setError("Server connection lost. Unable to update member.");
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: "100%", padding: "24px 32px 60px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* ── BACK BUTTON ── */}
        <button
          type="button"
          onClick={() => router.push("/dashboard/members")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: 700,
            color: "#0f172a",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            width: "fit-content",
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to members list</span>
        </button>

        {/* ── MAIN FORM CARD ── */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            border: "1px solid rgba(10, 10, 15, 0.08)",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.03)",
            padding: "36px 40px",
          }}
        >
          {loading ? (
            <div style={{ padding: "48px 20px", textAlign: "center", color: "#64748b" }}>
              <div
                style={{
                  margin: "0 auto 16px",
                  border: "3px solid #e2e8f0",
                  borderTop: "3px solid #10b981",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  animation: "spin 1s linear infinite",
                }}
              />
              <p style={{ fontWeight: 600, fontSize: "14px", margin: 0 }}>Fetching member profile...</p>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <AlertCircle size={40} color="#ef4444" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ color: "#ef4444", fontSize: "18px", fontWeight: 800, margin: "0 0 8px 0" }}>
                Profile Load Error
              </h3>
              <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 20px 0" }}>{error}</p>
              <button
                type="button"
                onClick={() => router.push("/dashboard/members")}
                style={{
                  padding: "12px 24px",
                  borderRadius: "12px",
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Return to Members
              </button>
            </div>
          ) : showSuccess ? (
            <div style={{ textAlign: "center", padding: "36px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#ecfdf5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#10b981",
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                Member Details Updated!
              </h2>
              <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                Profile changes saved persistently. Redirecting to roster...
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpdateMember} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Header Title */}
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    backgroundColor: "#0a0a0f",
                    color: "#c6ff3d",
                    fontSize: "11px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    width: "fit-content",
                    marginBottom: "8px",
                  }}
                >
                  <Users size={12} />
                  <span>Club Member Management</span>
                </div>
                <h1 style={{ fontSize: "26px", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em", margin: "0 0 6px 0" }}>
                  Edit Member Details
                </h1>
                <p style={{ fontSize: "14px", color: "#64748b", margin: 0, fontWeight: 500 }}>
                  Modify first name, last name, and contact details. Club assignment remains read-only.
                </p>
              </div>

              {/* Form Fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. MS"
                      required
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: "14px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#0f172a",
                        backgroundColor: "#f8fafc",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Dhoni"
                      required
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: "14px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#0f172a",
                        backgroundColor: "#f8fafc",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. msdhoni@gmail.com"
                    required
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: "14px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#0f172a",
                      backgroundColor: "#f8fafc",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 987987897789"
                      required
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: "14px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#0f172a",
                        backgroundColor: "#f8fafc",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                      Member Role *
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: "14px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#0f172a",
                        backgroundColor: "#f8fafc",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Group / Club Squad (Read-Only)
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    disabled
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#64748b",
                      backgroundColor: "#f1f5f9",
                      cursor: "not-allowed",
                      boxSizing: "border-box",
                    }}
                    title="Group assignment cannot be changed from this screen."
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/members")}
                  style={{
                    padding: "14px 24px",
                    borderRadius: "14px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    color: "#64748b",
                    fontWeight: 800,
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "14px 32px",
                    borderRadius: "14px",
                    backgroundColor: "#0a0a0f",
                    color: "#c6ff3d",
                    fontWeight: 800,
                    fontSize: "14px",
                    border: "none",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  <Save size={16} />
                  <span>{isSubmitting ? "Saving Profile..." : "Update Member"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
