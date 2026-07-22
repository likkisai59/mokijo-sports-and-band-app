"use client";
import { API_BASE_URL } from "@/lib/api";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useParams } from "next/navigation";
import "../../../styles/groupprofile.css";

function authHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export default function GroupProfilePage() {
    const { id } = useParams();
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [members, setMembers] = useState([]);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const coverInputRef = useRef(null);
    const [memberForm, setMemberForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "Player",
    });

    const handleAddMember = async (e) => {
        e.preventDefault();
        const userId = localStorage.getItem("userId");
        if (!userId) return;

        try {
            const encodedId = encodeURIComponent(id);
            const response = await fetch(`${API_BASE_URL}/groups/${encodedId}/members?owner_id=${userId}`, {
                method: "POST",
                headers: authHeaders(),
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
                toast.success("Member added successfully!");
            } else {
                const errData = await response.json();
                toast.error(`Failed to add member: ${errData.detail || "Unknown error"}`);
            }
        } catch (err) {
            console.error("Error adding member:", err);
            toast.error("Connection error while adding member.");
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
                const groupResponse = await fetch(`${API_BASE_URL}/groups/${encodedId}?owner_id=${userId}`, {
                    headers: authHeaders(),
                });

                let groupData = null;
                if (groupResponse.ok) {
                    groupData = await groupResponse.json();
                    setGroup(groupData);
                } else {
                    setError("This group could not be found for the signed-in club.");
                    setLoading(false);
                    return;
                }

                const membersResponse = await fetch(`${API_BASE_URL}/groups/${encodedId}/members?owner_id=${userId}`, {
                    headers: authHeaders(),
                });
                if (membersResponse.ok) {
                    const membersData = await membersResponse.json();
                    const storedName = localStorage.getItem("userName") || "Admin";
                    setMembers([
                        {
                            first_name: storedName.split(" ")[0] || storedName,
                            last_name: storedName.split(" ")[1] || "",
                            role: "Admin",
                        },
                        ...membersData,
                    ]);
                }
            } catch (err) {
                console.error("Network error fetching group data:", err);
                setError("Could not connect to the backend while loading this group.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchGroupData();
    }, [id]);

    const updateAvatar = async (avatarValue) => {
        const userId = localStorage.getItem("userId");
        if (!userId) return;
        setUploadingCover(true);
        try {
            const response = await fetch(`${API_BASE_URL}/groups/${id}?owner_id=${userId}`, {
                method: "PATCH",
                headers: authHeaders(),
                body: JSON.stringify({ avatar: avatarValue }),
            });
            if (response.ok) {
                const updated = await response.json();
                setGroup((prev) => ({ ...prev, avatar: updated.avatar }));
                toast.success(avatarValue ? "Cover photo updated" : "Cover photo removed");
            } else {
                const errData = await response.json().catch(() => ({}));
                toast.error(errData.detail || "Could not update cover photo");
            }
        } catch (err) {
            console.error(err);
            toast.error("Could not update cover photo");
        } finally {
            setUploadingCover(false);
        }
    };

    const handleCoverSelected = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Image must be under 2MB");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            updateAvatar(reader.result);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const handleDeleteGroup = async () => {
        if (!confirm(`Delete group "${group.group_name}"?`)) return;
        try {
            const response = await fetch(`${API_BASE_URL}/groups/${id}?owner_id=${localStorage.getItem("userId")}`, {
                method: "DELETE",
                headers: authHeaders(),
            });
            if (response.ok) window.location.href = "/dashboard";
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="group-state-card">Loading profile...</div>;
    if (!group) return <div className="group-state-card error">{error || "Group not found"}</div>;

    return (
        <div className="group-profile">
            <header
                className="profile-header"
                style={
                    group.avatar
                        ? {
                              backgroundImage: `linear-gradient(rgba(8,8,15,0.55), rgba(8,8,15,0.85)), url(${group.avatar})`,
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
                        style={{ display: "none" }}
                        onChange={handleCoverSelected}
                    />
                    <button
                        type="button"
                        className="add-profile-photo-btn"
                        disabled={uploadingCover}
                        onClick={() => coverInputRef.current?.click()}
                    >
                        {uploadingCover ? "Uploading…" : "+ Cover photo"}
                    </button>
                    {group.avatar && (
                        <button
                            type="button"
                            className="delete-group-btn"
                            style={{ marginTop: 0 }}
                            disabled={uploadingCover}
                            onClick={() => updateAvatar(null)}
                        >
                            Delete photo
                        </button>
                    )}
                    <button className="delete-group-btn" onClick={handleDeleteGroup}>
                        Delete Group
                    </button>
                </div>
            </header>

            <section className="group-profile-stats">
                <div>
                    <span>Members</span>
                    <strong>{members.length}</strong>
                </div>
            </section>

            <div className="profile-content" style={{ gridTemplateColumns: "1fr" }}>
                <div className="main-feed">
                    <div className="members-list-card">
                        <div className="members-header">
                            <h3>Members ({members.length})</h3>
                            <button className="add-member-inline-btn" onClick={() => setShowAddMemberModal(true)}>
                                + Add Member
                            </button>
                        </div>
                        <div className="members-list-content">
                            {members.length > 0 ? (
                                members.map((member, index) => (
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
                                ))
                            ) : (
                                <div className="empty-events-profile">
                                    <h3>No members yet</h3>
                                    <p>Add your first team member to get started.</p>
                                </div>
                            )}
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
        </div>
    );
}
