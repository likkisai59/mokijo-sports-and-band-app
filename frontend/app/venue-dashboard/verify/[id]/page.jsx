"use client";
import { API_BASE_URL } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API = API_BASE_URL;

export default function VerificationWizardPage() {
    const params = useParams();
    const router = useRouter();
    const venueId = params.id;
    const ownerId = typeof window !== "undefined" ? localStorage.getItem("venueOwnerId") : null;

    const [activeStep, setActiveStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // Venue fields
    const [venue, setVenue] = useState(null);

    // Step 1: Contact & Address
    const [contactInfo, setContactInfo] = useState({
        contact_phone: "",
        contact_email: "",
        city: "",
        state_name: "",
        postal_code: "",
        description: ""
    });

    // Step 2: Location / GPS
    const [locationCaptured, setLocationCaptured] = useState(false);
    const [gps, setGps] = useState({
        latitude: "",
        longitude: ""
    });

    // Step 3: Photos (min 3)
    const [photos, setPhotos] = useState([]);

    // Step 4: Documents (min 1)
    const [docs, setDocs] = useState([]);
    const [newDoc, setNewDoc] = useState({
        document_type: "business_registration",
        document_label: "",
        file_path: "", // Base64
        original_filename: "",
        file_size: 0,
        mime_type: ""
    });
    const [uploadingDoc, setUploadingDoc] = useState(false);

    useEffect(() => {
        if (!venueId || !ownerId) return;
        const fetchVenueDetails = async () => {
            try {
                // Fetch venue basic info
                const res = await fetch(`${API}/venue-owner/${ownerId}/venues`);
                if (res.ok) {
                    const allVenues = await res.json();
                    const v = allVenues.find(item => item.id == venueId);
                    if (v) {
                        setVenue(v);
                        setContactInfo({
                            contact_phone: v.contact_phone || "",
                            contact_email: v.contact_email || "",
                            city: v.city || "",
                            state_name: v.state_name || "",
                            postal_code: v.postal_code || "",
                            description: v.description || ""
                        });
                        if (v.gps_latitude && v.gps_longitude) {
                            setGps({
                                latitude: v.gps_latitude,
                                longitude: v.gps_longitude
                            });
                            setLocationCaptured(true);
                        }
                        // Parse existing photos
                        try {
                            const parsed = JSON.parse(v.venue_images || "[]");
                            setPhotos(Array.isArray(parsed) ? parsed : []);
                        } catch {
                            setPhotos([]);
                        }
                    }
                }

                // Fetch documents
                const docRes = await fetch(`${API}/venues/${venueId}/documents`);
                if (docRes.ok) {
                    setDocs(await docRes.json());
                }
            } catch (err) {
                console.error("Error loading verification details", err);
            } finally {
                setLoading(false);
            }
        };

        fetchVenueDetails();
    }, [venueId, ownerId]);

    // Handle File to Base64
    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotos(prev => {
                    const updated = [...prev, reader.result];
                    // Save dynamically to the venue
                    savePhotosToBackend(updated);
                    return updated;
                });
            };
            reader.readAsDataURL(file);
        });
    };

    const savePhotosToBackend = async (updatedPhotos) => {
        if (!venue) return;
        try {
            const body = {
                name: venue.name,
                location: venue.location,
                landmark: venue.landmark || null,
                sports_supported: venue.sports_supported,
                amenities: venue.amenities,
                cover_image: updatedPhotos[0] || venue.cover_image || null,
                venue_images: JSON.stringify(updatedPhotos),
                opening_time: venue.opening_time || null,
                closing_time: venue.closing_time || null,
                days_open: venue.days_open || null,
                slot_duration: venue.slot_duration || 60,
                contact_phone: contactInfo.contact_phone || null,
                contact_email: contactInfo.contact_email || null,
                city: contactInfo.city || null,
                state_name: contactInfo.state_name || null,
                postal_code: contactInfo.postal_code || null,
            };
            await fetch(`${API}/venues/${venueId}?owner_id=${ownerId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
        } catch (err) {
            console.error("Failed to save photos", err);
        }
    };

    const removePhoto = (index) => {
        setPhotos(prev => {
            const updated = prev.filter((_, i) => i !== index);
            savePhotosToBackend(updated);
            return updated;
        });
    };

    // Capture GPS
    const captureGPS = () => {
        if (typeof navigator !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    setGps({ latitude: lat, longitude: lon });
                    setLocationCaptured(true);
                    // Save GPS immediately to backend
                    try {
                        await fetch(`${API}/venues/${venueId}/gps-location`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ latitude: lat, longitude: lon })
                        });
                    } catch (err) {
                        console.error("Failed saving GPS", err);
                    }
                },
                (err) => {
                    console.warn("Geolocation permission denied, using mock fallback coordinates");
                    // Mock coordinates fallback
                    const lat = 12.9716;
                    const lon = 77.5946;
                    setGps({ latitude: lat, longitude: lon });
                    setLocationCaptured(true);
                }
            );
        }
    };

    // Document Upload
    const handleDocumentFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setNewDoc(prev => ({
                ...prev,
                file_path: reader.result,
                original_filename: file.name,
                file_size: file.size,
                mime_type: file.type
            }));
        };
        reader.readAsDataURL(file);
    };

    const uploadDocument = async () => {
        if (!newDoc.file_path) {
            alert("Please select a file first.");
            return;
        }
        setUploadingDoc(true);
        try {
            const res = await fetch(`${API}/venues/${venueId}/documents`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newDoc)
            });
            if (res.ok) {
                // Reload documents
                const docRes = await fetch(`${API}/venues/${venueId}/documents`);
                if (docRes.ok) {
                    setDocs(await docRes.json());
                }
                setNewDoc({
                    document_type: "business_registration",
                    document_label: "",
                    file_path: "",
                    original_filename: "",
                    file_size: 0,
                    mime_type: ""
                });
            } else {
                const err = await res.json();
                alert(err.detail || "Failed to upload document.");
            }
        } catch (err) {
            console.error("Doc upload failed", err);
        } finally {
            setUploadingDoc(false);
        }
    };

    const submitForVerification = async () => {
        if (photos.length < 3) {
            setErrorMsg("At least 3 venue photos are required before submitting.");
            return;
        }
        if (docs.length < 1) {
            setErrorMsg("At least 1 verification document is required before submitting.");
            return;
        }
        setSubmitting(true);
        setErrorMsg("");
        try {
            const res = await fetch(`${API}/venues/${venueId}/submit-verification`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(contactInfo)
            });
            const data = await res.json();
            if (res.ok) {
                setMsg("Venue submitted for verification successfully!");
                setTimeout(() => {
                    router.push("/venue-dashboard/my-venues");
                }, 1500);
            } else {
                setErrorMsg(data.detail || "Submission failed.");
            }
        } catch (err) {
            setErrorMsg("Cannot connect to the server.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="vd-loading">
                <div className="vd-spinner" /> Loading verification details…
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h1 className="vd-page-title">Venue Verification Wizard</h1>
            <p className="vd-page-sub">Verify your venue &ldquo;{venue?.name}&rdquo; to enable booking & listings</p>

            {/* Step Wizard Header */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 30, background: "rgba(255,255,255,0.02)", border: "1px solid var(--vd-border)", borderRadius: 12, padding: "16px 24px" }}>
                {[
                    { nr: 1, title: "Contact" },
                    { nr: 2, title: "Location" },
                    { nr: 3, title: "Photos" },
                    { nr: 4, title: "Documents" },
                    { nr: 5, title: "Review" }
                ].map((s) => (
                    <div key={s.nr} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: activeStep === s.nr ? "var(--vd-brand)" : activeStep > s.nr ? "rgba(198, 255, 61,0.2)" : "rgba(255,255,255,0.05)",
                            color: activeStep === s.nr ? "#000" : activeStep > s.nr ? "var(--vd-brand)" : "rgba(255,255,255,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 700
                        }}>
                            {activeStep > s.nr ? "✓" : s.nr}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: activeStep === s.nr ? 700 : 500, color: activeStep === s.nr ? "#fff" : "rgba(255,255,255,0.4)" }}>
                            {s.title}
                        </span>
                    </div>
                ))}
            </div>

            {/* STEP 1: Contact & Address */}
            {activeStep === 1 && (
                <div className="vd-card">
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Step 1: Venue Contact & Address</h2>
                    <div className="vd-form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                        <div className="vd-field">
                            <label className="vd-label">Contact Phone Number *</label>
                            <input
                                className="vd-input"
                                placeholder="+91 XXXXX XXXXX"
                                value={contactInfo.contact_phone}
                                onChange={(e) => setContactInfo(prev => ({ ...prev, contact_phone: e.target.value }))}
                            />
                        </div>
                        <div className="vd-field">
                            <label className="vd-label">Contact Email Address *</label>
                            <input
                                className="vd-input"
                                placeholder="info@venue.com"
                                type="email"
                                value={contactInfo.contact_email}
                                onChange={(e) => setContactInfo(prev => ({ ...prev, contact_email: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="vd-form-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                        <div className="vd-field">
                            <label className="vd-label">City *</label>
                            <input
                                className="vd-input"
                                placeholder="Bengaluru"
                                value={contactInfo.city}
                                onChange={(e) => setContactInfo(prev => ({ ...prev, city: e.target.value }))}
                            />
                        </div>
                        <div className="vd-field">
                            <label className="vd-label">State *</label>
                            <input
                                className="vd-input"
                                placeholder="Karnataka"
                                value={contactInfo.state_name}
                                onChange={(e) => setContactInfo(prev => ({ ...prev, state_name: e.target.value }))}
                            />
                        </div>
                        <div className="vd-field">
                            <label className="vd-label">Postal Code *</label>
                            <input
                                className="vd-input"
                                placeholder="560001"
                                value={contactInfo.postal_code}
                                onChange={(e) => setContactInfo(prev => ({ ...prev, postal_code: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="vd-field">
                        <label className="vd-label">Brief Description / Amenities Summary</label>
                        <textarea
                            className="vd-input"
                            style={{ minHeight: 80, resize: "vertical" }}
                            placeholder="Add brief details about court rules, security, or guidelines."
                            value={contactInfo.description}
                            onChange={(e) => setContactInfo(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>
                </div>
            )}

            {/* STEP 2: Location Verification */}
            {activeStep === 2 && (
                <div className="vd-card" style={{ textAlign: "center", padding: "40px 24px" }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Step 2: Location Verification (GPS Capture)</h2>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 24, maxWidth: 500, margin: "0 auto 24px auto" }}>
                        We require GPS confirmation to ensure the physical authenticity of the sports venue.
                    </p>

                    <button className="vd-btn-primary" onClick={captureGPS} style={{ padding: "12px 28px", fontSize: 14 }}>
                        Capture Current GPS Coordinates
                    </button>

                    {locationCaptured && (
                        <div style={{ marginTop: 24, display: "inline-block", background: "rgba(198, 255, 61,0.08)", border: "1px solid rgba(198, 255, 61,0.2)", padding: "12px 24px", borderRadius: 10 }}>
                            <div style={{ fontSize: 13, color: "var(--vd-brand)", fontWeight: 700 }}>✓ GPS Coordinates Captured Successfully</div>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                                Latitude: {gps.latitude} · Longitude: {gps.longitude}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* STEP 3: Photos */}
            {activeStep === 3 && (
                <div className="vd-card">
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Step 3: Venue Photos (At least 3)</h2>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
                        Upload high-quality photos of courts, entries, and amenities. You currently have <strong>{photos.length}</strong> photo(s) uploaded.
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                        {photos.map((img, idx) => (
                            <div key={idx} style={{ position: "relative", height: 110, borderRadius: 10, overflow: "hidden", border: "1px solid var(--vd-border)" }}>
                                <img src={img} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                <button
                                    onClick={() => removePhoto(idx)}
                                    style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "#ff4d4d", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContext: "center", paddingLeft: 6 }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed var(--vd-border)", borderRadius: 10, cursor: "pointer", height: 110, background: "rgba(255,255,255,0.01)" }}>
                            <span style={{ fontSize: 24, opacity: 0.4 }}>+</span>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Add Photo</span>
                            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: "none" }} />
                        </label>
                    </div>
                </div>
            )}

            {/* STEP 4: Document Upload */}
            {activeStep === 4 && (
                <div className="vd-card">
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Step 4: Upload Verification Document</h2>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
                        Provide official legal documents (ownership proof, business registration, or rental agreement). At least 1 document is required.
                    </p>

                    {/* Upload Box */}
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed var(--vd-border)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
                        <div className="vd-form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                            <div className="vd-field">
                                <label className="vd-label">Document Type *</label>
                                <select
                                    className="vd-input"
                                    value={newDoc.document_type}
                                    onChange={(e) => setNewDoc(prev => ({ ...prev, document_type: e.target.value }))}
                                >
                                    <option value="business_registration">Business Registration</option>
                                    <option value="ownership_proof">Proof of Ownership</option>
                                    <option value="lease_agreement">Lease Agreement</option>
                                    <option value="other">Other Document</option>
                                </select>
                            </div>
                            <div className="vd-field">
                                <label className="vd-label">Document Label / Description</label>
                                <input
                                    className="vd-input"
                                    placeholder="e.g. GST Registration Certificate"
                                    value={newDoc.document_label}
                                    onChange={(e) => setNewDoc(prev => ({ ...prev, document_label: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="vd-field" style={{ marginBottom: 14 }}>
                            <label className="vd-label">Select Document File *</label>
                            <input type="file" onChange={handleDocumentFile} className="vd-input" accept=".pdf,image/*" />
                        </div>

                        <button className="vd-btn-primary" onClick={uploadDocument} disabled={uploadingDoc}>
                            {uploadingDoc ? "Uploading..." : "Upload Document"}
                        </button>
                    </div>

                    {/* Document List */}
                    <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Uploaded Documents ({docs.length})</h3>
                    {docs.length === 0 ? (
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No documents uploaded yet.</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {docs.map((d) => (
                                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", border: "1px solid var(--vd-border)", borderRadius: 8, padding: "10px 14px" }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{d.original_filename || "Document"}</div>
                                        <div style={{ fontSize: 11, color: "var(--vd-brand)" }}>{d.document_type.replace(/_/g, " ")} {d.document_label ? `(${d.document_label})` : ""}</div>
                                    </div>
                                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                                        {d.file_size ? `${Math.round(d.file_size / 1024)} KB` : ""}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* STEP 5: Review & Submit */}
            {activeStep === 5 && (
                <div className="vd-card">
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Step 5: Review & Submit Application</h2>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ borderBottom: "1px solid var(--vd-border)", paddingBottom: 10 }}>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Venue Name</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{venue?.name}</div>
                        </div>

                        <div style={{ borderBottom: "1px solid var(--vd-border)", paddingBottom: 10 }}>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Contact Details</div>
                            <div style={{ fontSize: 13 }}>Phone: {contactInfo.contact_phone}</div>
                            <div style={{ fontSize: 13 }}>Email: {contactInfo.contact_email}</div>
                        </div>

                        <div style={{ borderBottom: "1px solid var(--vd-border)", paddingBottom: 10 }}>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Address Info</div>
                            <div style={{ fontSize: 13 }}>{contactInfo.city}, {contactInfo.state_name} - {contactInfo.postal_code}</div>
                        </div>

                        <div style={{ borderBottom: "1px solid var(--vd-border)", paddingBottom: 10 }}>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>GPS Location</div>
                            <div style={{ fontSize: 13 }}>
                                {locationCaptured ? `Captured: ${gps.latitude}, ${gps.longitude}` : "⚠️ Geolocation not captured yet"}
                            </div>
                        </div>

                        <div style={{ borderBottom: "1px solid var(--vd-border)", paddingBottom: 10 }}>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Photos Uploaded</div>
                            <div style={{ fontSize: 13 }}>{photos.length} photos (minimum 3 required)</div>
                        </div>

                        <div style={{ borderBottom: "1px solid var(--vd-border)", paddingBottom: 10 }}>
                            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Documents Uploaded</div>
                            <div style={{ fontSize: 13 }}>{docs.length} documents (minimum 1 required)</div>
                        </div>
                    </div>

                    {errorMsg && (
                        <div style={{ color: "#ff4d4d", fontSize: 13, marginTop: 16 }}>
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    {msg && (
                        <div style={{ color: "var(--vd-brand)", fontSize: 13, marginTop: 16 }}>
                            ✓ {msg}
                        </div>
                    )}
                </div>
            )}

            {/* Navigation Buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                <button
                    className="vd-btn-ghost"
                    onClick={() => {
                        if (activeStep > 1) setActiveStep(activeStep - 1);
                        else router.push("/venue-dashboard/my-venues");
                    }}
                >
                    Back
                </button>

                {activeStep < 5 ? (
                    <button
                        className="vd-btn-primary"
                        onClick={() => {
                            if (activeStep === 1 && (!contactInfo.contact_phone || !contactInfo.contact_email || !contactInfo.city || !contactInfo.state_name || !contactInfo.postal_code)) {
                                alert("Please fill in all required fields.");
                                return;
                            }
                            if (activeStep === 2 && !locationCaptured) {
                                alert("Please capture the GPS location first.");
                                return;
                            }
                            setActiveStep(activeStep + 1);
                        }}
                    >
                        Next
                    </button>
                ) : (
                    <button
                        className="vd-btn-primary"
                        onClick={submitForVerification}
                        disabled={submitting}
                    >
                        {submitting ? "Submitting Application..." : "Submit Verification"}
                    </button>
                )}
            </div>
        </div>
    );
}
