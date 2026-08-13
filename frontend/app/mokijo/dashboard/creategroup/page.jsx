"use client";

import { API_BASE_URL } from "@/lib/api";
import { useState } from "react";
import "@/app/styles/creategroup.css";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";

export default function CreateGroupPage() {
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [activity, setActivity] = useState("");
    const [groupName, setGroupName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const activities = [
        { name: "Basketball", icon: "🏀" },
        { name: "Badminton", icon: "🏸" },
        { name: "Cricket", icon: "🏏" },
        { name: "Chess", icon: "♟️" },
        { name: "Carrom", icon: "⚪" },
        { name: "Table Tennis", icon: "🏓" },
        { name: "Volleyball", icon: "🏐" },
        { name: "Football", icon: "⚽" },
    ];

    const handleActivitySelect = (item) => {
        setActivity(item.name);
        setStep(2);
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const handleCreateGroup = async () => {
        if (!groupName) {
            alert("Please enter a group name");
            return;
        }

        setIsSubmitting(true);
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("accessToken");

        const groupData = {
            activity: activity,
            group_name: groupName,
            description: description,
            owner_id: userId ? parseInt(userId) : null,
        };

        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/groups`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(groupData),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                const errMsg = errData?.detail || "Failed to create group. Please check your login session.";
                alert(errMsg);
                setIsSubmitting(false);
                return;
            }

            const data = await response.json();
            console.log("Saved group:", data);

            window.dispatchEvent(new Event("groupsUpdated")); // Refresh sidebar

            setShowSuccess(true);

            setTimeout(() => {
                router.push("/dashboard/groups");
            }, 1800);
        } catch (error) {
            console.log("Error:", error);
            alert("Backend is not running or API error");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="create-group-page">
            <div className="create-group-container">
                {/* Stepper Progress Bar */}
                <div className="progress-stepper">
                    <div className={`step-dot ${step >= 1 ? "active" : ""}`}>1</div>
                    <div className={`step-line ${step >= 2 ? "active" : ""}`}></div>
                    <div className={`step-dot ${step >= 2 ? "active" : ""}`}>2</div>
                </div>

                <div className="form-card">
                    {step === 1 && (
                        <div className="step-content fade-in">
                            <div className="brand-pill-badge">
                                <Sparkles size={13} />
                                <span>MUKIJO • STEP 1 OF 2</span>
                            </div>

                            <div className="step-header">
                                <h1>Select Sport & Activity</h1>
                                <p>Choose the core activity for your new squad group.</p>
                            </div>

                            <div className="activity-grid">
                                {activities.map((item) => (
                                    <button
                                        key={item.name}
                                        className={`choice-card-row ${activity === item.name ? "selected" : ""}`}
                                        onClick={() => handleActivitySelect(item)}
                                    >
                                        <span className="icon">{item.icon}</span>
                                        <span className="label">{item.name}</span>
                                        <ChevronRight size={16} color="#94a3b8" style={{ marginLeft: "auto" }} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="step-content fade-in">
                            {showSuccess ? (
                                <div className="success-message">
                                    <div className="success-icon">
                                        <CheckCircle2 size={56} color="#10b981" />
                                    </div>
                                    <h1>Group Successfully Created!</h1>
                                    <p>Your new squad group &quot;{groupName}&quot; is active. Redirecting to squads directory...</p>
                                </div>
                            ) : (
                                <>
                                    <button className="back-btn" onClick={handleBack}>
                                        <ArrowLeft size={14} />
                                        <span>Back to Sport Selection</span>
                                    </button>

                                    <div className="brand-pill-badge">
                                        <Sparkles size={13} />
                                        <span>MUKIJO • STEP 2 OF 2</span>
                                    </div>

                                    <div className="step-header">
                                        <h1>Squad Group Details</h1>
                                        <p>Give your {activity} group a unique name and description.</p>
                                    </div>

                                    <div className="input-section">
                                        <div className="input-group">
                                            <label>Group Name *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Morning Tigers FC"
                                                value={groupName}
                                                onChange={(e) => setGroupName(e.target.value)}
                                            />
                                        </div>

                                        <div className="input-group">
                                            <label>Description & Member Guidelines</label>
                                            <textarea
                                                placeholder="Tell members what this squad group is about..."
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                            ></textarea>
                                        </div>
                                    </div>

                                    <button className="submit-btn" onClick={handleCreateGroup} disabled={isSubmitting}>
                                        {isSubmitting ? "Creating Squad Group..." : "Create Squad Group"}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
