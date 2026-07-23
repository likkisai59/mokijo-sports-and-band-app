"use client";
import { API_BASE_URL } from "@/lib/api";

import { useState } from "react";
import "../../styles/creategroup.css";
import { useRouter } from "next/navigation";

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

        const groupData = {
            activity: activity,
            group_name: groupName,
            description: description,
            owner_id: userId,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/groups`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(groupData),
            });

            if (!response.ok) {
                alert("Something went wrong");
                setIsSubmitting(false);
                return;
            }

            const data = await response.json();
            console.log("Saved group:", data);

            window.dispatchEvent(new Event("groupsUpdated")); // Refresh sidebar

            setShowSuccess(true);

            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);
        } catch (error) {
            console.log("Error:", error);
            alert("Backend is not running or API error");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="create-group-page">
            <div className="create-group-container">
                <div className="progress-stepper">
                    <div className={`step-dot ${step >= 1 ? "active" : ""}`}>1</div>
                    <div className={`step-line ${step >= 2 ? "active" : ""}`}></div>
                    <div className={`step-dot ${step >= 2 ? "active" : ""}`}>2</div>
                </div>

                <div className="form-card">
                    {step === 1 && (
                        <div className="step-content fade-in">
                            <div className="step-header">
                                <h1>Select Activity</h1>
                                <p>What kind of group are you starting?</p>
                            </div>

                            <div className="activity-list">
                                {activities.map((item) => (
                                    <button
                                        key={item.name}
                                        className={`choice-card-row ${activity === item.name ? "selected" : ""}`}
                                        onClick={() => handleActivitySelect(item)}
                                    >
                                        <span className="icon">{item.icon}</span>
                                        <span className="label">{item.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="step-content fade-in">
                            {showSuccess ? (
                                <div className="success-message">
                                    <div className="success-icon">✅</div>
                                    <h1>Group Created!</h1>
                                    <p>Your new group &quot;{groupName}&quot; is ready. Redirecting to dashboard...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="step-header">
                                        <button className="back-btn" onClick={handleBack}>
                                            ← Back
                                        </button>

                                        <h1>Group Details</h1>
                                        <p>Give your group a name and identity.</p>
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
                                            <label>Description</label>
                                            <textarea
                                                placeholder="Tell members what this group is about..."
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                            ></textarea>
                                        </div>
                                    </div>

                                    <button className="submit-btn" onClick={handleCreateGroup} disabled={isSubmitting}>
                                        {isSubmitting ? "Creating..." : "Create Group"}
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
