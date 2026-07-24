"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useParams } from "next/navigation";
import * as XLSX from "xlsx";
import "../../../styles/groupprofile.css";

export default function GroupProfilePage() {
    const { id } = useParams();
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [coverPhoto, setCoverPhoto] = useState(null);
    const coverInputRef = useRef(null);

    const [members, setMembers] = useState([]);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [memberForm, setMemberForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "Player",
    });
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importing, setImporting] = useState(false);

    const handleCoverPhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setCoverPhoto(reader.result);
        reader.readAsDataURL(file);
    };

    const buildMembersList = (membersData) => {
        const storedName = localStorage.getItem("userName") || "Admin";
        return [
            {
                first_name: storedName.split(" ")[0] || storedName,
                last_name: storedName.split(" ")[1] || "",
                role: "Admin",
            },
            ...membersData,
        ];
    };

    const refreshMembers = async () => {
        const userId = localStorage.getItem("userId");
        if (!userId || !id) return;
        const encodedId = encodeURIComponent(id);
        const membersResponse = await fetch(`${API_BASE_URL}/groups/${encodedId}/members?owner_id=${userId}`);
        if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            setMembers(buildMembersList(membersData));
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        try {
            const encodedId = encodeURIComponent(id);
            const response = await fetch(`${API_BASE_URL}/groups/${encodedId}/members?owner_id=${userId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    first_name: memberForm.first_name,
                    last_name: memberForm.last_name || "",
                    email: memberForm.email || "",
                    phone: memberForm.phone || "",
                    role: memberForm.role || "Player",
                }),
            });

            if (response.ok) {
                const newMember = await response.json();
                setMembers((prev) => [...prev, newMember]);
                setShowAddMemberModal(false);
                setMemberForm({
                    first_name: "",
                    last_name: "",
                    email: "",
                    phone: "",
                    role: "Player",
                });
                toast.success("Member added successfully! 🎉");
            } else {
                const errData = await response.json();
                toast.error(`Failed to add member: ${errData.detail || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Error adding member:", error);
            toast.error("Connection error while adding member.");
        }
    };

    const downloadMembersTemplate = () => {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet([
            {
                first_name: "Rahul",
                last_name: "Sharma",
                email: "rahul@example.com",
                phone: "9876543210",
                role: "Player",
            },
            {
                first_name: "Priya",
                last_name: "Patel",
                email: "priya@example.com",
                phone: "9123456780",
                role: "Coach",
            },
        ]);
        XLSX.utils.book_append_sheet(wb, ws, "Members");
        XLSX.writeFile(wb, "Members_Import_Template.xlsx");
    };

    const handleImportMembers = async () => {
        if (!importFile) {
            toast.error("Please select an Excel file first.");
            return;
        }

        const userId = localStorage.getItem("userId");
        if (!userId) {
            toast.error("Please sign in again.");
            return;
        }

        if (!group?.id) {
            toast.error("Group not loaded.");
            return;
        }

        setImporting(true);
        const formData = new FormData();
        formData.append("file", importFile);
        formData.append("owner_id", userId);

        try {
            const response = await fetch(`${API_BASE_URL}/groups/${group.id}/members/import`, {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message || "Members imported successfully!");
                setShowImportModal(false);
                setImportFile(null);
                await refreshMembers();
            } else {
                const errData = await response.json().catch(() => ({}));
                toast.error(errData.detail || "Import failed.");
            }
        } catch (error) {
            console.error("Error importing members:", error);
            toast.error("Connection error while importing members.");
        } finally {
            setImporting(false);
        }
    };

    useEffect(() => {
        const fetchGroupData = async () => {
            const userId = localStorage.getItem("userId");
            if (!userId || userId === "undefined") {
                setError("Please sign in again to view this group profile.");
                setLoading(false);
                return;
            }

            try {
                const encodedId = encodeURIComponent(id);
                const groupResponse = await fetch(`${API_BASE_URL}/groups/${encodedId}?owner_id=${userId}`);

                if (groupResponse.ok) {
                    const groupData = await groupResponse.json();
                    setGroup(groupData);
                    if (groupData.avatar) setCoverPhoto(groupData.avatar);
                } else {
                    setError("This group could not be found for the signed-in club.");
                    setLoading(false);
                    return;
                }

                const membersResponse = await fetch(`${API_BASE_URL}/groups/${encodedId}/members?owner_id=${userId}`);
                if (membersResponse.ok) {
                    const membersData = await membersResponse.json();
                    setMembers(buildMembersList(membersData));
                }
            } catch (error) {
                console.error("Network error fetching group data:", error);
                setError("Could not connect to the backend while loading this group.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchGroupData();
    }, [id]);

    const handleDeleteGroup = async () => {
        if (!confirm(`Delete group "${group.group_name}"?`)) return;
        try {
            const response = await fetch(`${API_BASE_URL}/groups/${id}?owner_id=${localStorage.getItem("userId")}`, {
                method: "DELETE",
            });
            if (response.ok) window.location.href = "/dashboard";
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="group-state-card">Loading profile...</div>;
    if (!group) return <div className="group-state-card error">{error || "Group not found"}</div>;

    return (
        <div className="group-profile">
            <header
                className="profile-header"
                style={
                    coverPhoto
                        ? {
                              backgroundImage: `linear-gradient(to top, rgba(8,8,15,0.85) 0%, rgba(8,8,15,0.35) 50%, rgba(8,8,15,0.2) 100%), url(${coverPhoto})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                          }
                        : undefined
                }
            >
                <div>
                    <p className="profile-kicker">{group.activity || "Group"}</p>
                    <h1>{group.group_name}</h1>
                    {group.description && <p className="profile-description">{group.description}</p>}
                </div>
                <div className="group-profile-photo-container">
                    <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleCoverPhotoChange}
                    />
                    <button
                        type="button"
                        className="add-profile-photo-btn"
                        onClick={() => coverInputRef.current?.click()}
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                        {coverPhoto ? "Change cover photo" : "Add cover photo"}
                    </button>
                    <button className="delete-group-btn" onClick={handleDeleteGroup}>
                        Delete Group
                    </button>
                </div>
            </header>

            <div className="profile-content profile-content--full">
                <div className="main-feed">
                    <div className="group-overview-grid">
                        <div className="members-list-card">
                            <div className="members-header">
                                <h3>Group Details</h3>
                            </div>
                            <div className="group-detail-list">
                                <div>
                                    <span>Activity</span>
                                    <strong>{group.activity || "Not set"}</strong>
                                </div>
                                <div>
                                    <span>Age Group</span>
                                    <strong>{group.age_group || "Not set"}</strong>
                                </div>
                                <div>
                                    <span>Sub Group</span>
                                    <strong>{group.sub_group || "None"}</strong>
                                </div>
                                <div>
                                    <span>Description</span>
                                    <strong>{group.description || "No description added yet."}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="members-list-card">
                            <div className="members-header">
                                <h3>Members ({members.length})</h3>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button className="add-member-inline-btn" onClick={() => setShowImportModal(true)}>
                                        Import
                                    </button>
                                    <button
                                        className="add-member-inline-btn"
                                        onClick={() => setShowAddMemberModal(true)}
                                    >
                                        Add Member
                                    </button>
                                </div>
                            </div>
                            <div className="members-list-content">
                                {members.map((member, index) => (
                                    <div className="member-item" key={`${member.id || "admin"}-${index}`}>
                                        <div className="member-avatar">
                                            {(member.first_name || "M").charAt(0).toUpperCase()}
                                        </div>
                                        <div className="member-info">
                                            <span className="member-name">
                                                {member.first_name} {member.last_name}
                                            </span>
                                            <span className="member-role">{member.role || "Member"}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showAddMemberModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-header">
                            <h2>Add New Member</h2>
                            <button className="close-btn" onClick={() => setShowAddMemberModal(false)}>
                                &times;
                            </button>
                        </div>
                        <form className="member-form" onSubmit={handleAddMember}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="first_name">First Name *</label>
                                    <input
                                        type="text"
                                        id="first_name"
                                        required
                                        value={memberForm.first_name}
                                        onChange={(e) =>
                                            setMemberForm((prev) => ({ ...prev, first_name: e.target.value }))
                                        }
                                        placeholder="e.g. Rahul"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="last_name">Last Name</label>
                                    <input
                                        type="text"
                                        id="last_name"
                                        value={memberForm.last_name}
                                        onChange={(e) =>
                                            setMemberForm((prev) => ({ ...prev, last_name: e.target.value }))
                                        }
                                        placeholder="e.g. Sharma"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={memberForm.email}
                                    onChange={(e) => setMemberForm((prev) => ({ ...prev, email: e.target.value }))}
                                    placeholder="e.g. rahul@example.com"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    value={memberForm.phone}
                                    onChange={(e) => setMemberForm((prev) => ({ ...prev, phone: e.target.value }))}
                                    placeholder="e.g. +91 98765 43210"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="role">Role</label>
                                <select
                                    id="role"
                                    value={memberForm.role}
                                    onChange={(e) => setMemberForm((prev) => ({ ...prev, role: e.target.value }))}
                                >
                                    <option value="Player">Player</option>
                                    <option value="Parent">Parent</option>
                                    <option value="Coach">Coach</option>
                                    <option value="Referee">Referee</option>
                                </select>
                            </div>
                            <button type="submit" className="submit-member-btn">
                                Add Member to Group
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {showImportModal && (
                <div className="modal-overlay">
                    <div className="modal-card import-modal-mini">
                        <div className="modal-header">
                            <h2>Import Members</h2>
                            <button
                                className="close-btn"
                                onClick={() => {
                                    setShowImportModal(false);
                                    setImportFile(null);
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="template-download-box">
                            <p>1. Download template</p>
                            <button type="button" className="download-template-link" onClick={downloadMembersTemplate}>
                                Download Excel Template
                            </button>
                        </div>

                        <div className="file-upload-box">
                            <p>2. Upload filled Excel file</p>
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                id="members-import-upload"
                                hidden
                                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                            />
                            <label
                                htmlFor="members-import-upload"
                                className="download-template-link"
                                style={{ display: "inline-block", marginTop: "4px", cursor: "pointer" }}
                            >
                                {importFile ? importFile.name : "Choose Excel file"}
                            </label>
                            <p style={{ marginTop: "12px", fontSize: "12px", color: "rgba(148,163,184,0.7)", fontWeight: 400 }}>
                                Required columns: first_name, last_name, email. Optional: phone, role.
                            </p>
                        </div>

                        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                            <button
                                type="button"
                                className="download-template-link cancel-btn-modal"
                                onClick={() => {
                                    setShowImportModal(false);
                                    setImportFile(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="submit-member-btn"
                                style={{ marginTop: 0, padding: "11px 18px" }}
                                onClick={handleImportMembers}
                                disabled={!importFile || importing}
                            >
                                {importing ? "Importing..." : "Start Import"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
