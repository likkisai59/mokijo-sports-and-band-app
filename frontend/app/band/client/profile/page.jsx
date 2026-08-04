"use client";

import { User } from "lucide-react";
import { getBandUser } from "@/lib/bandAuth";
import { useEffect, useState } from "react";

export default function ClientProfilePage() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        setUser(getBandUser());
    }, []);

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div>
                <h1 className="cd-page-title flex items-center gap-2">
                    <User className="h-6.5 w-6.5 text-primary" />
                    My Profile
                </h1>
                <p className="cd-page-sub">
                    View and update your personal information.
                </p>
            </div>

            <div className="cd-card max-w-3xl">
                <div className="cd-card-header">
                    <h2 className="cd-card-title">Personal Details</h2>
                </div>
                
                <div className="space-y-6">
                    <div className="cd-form-grid">
                        <div className="cd-field">
                            <label className="cd-label">Full Name</label>
                            <input type="text" className="cd-input" defaultValue={user?.name || ""} disabled />
                        </div>
                        <div className="cd-field">
                            <label className="cd-label">Email Address</label>
                            <input type="email" className="cd-input" defaultValue={user?.email || ""} disabled />
                        </div>
                    </div>
                    
                    <div className="cd-field max-w-xs">
                        <label className="cd-label">Role</label>
                        <input type="text" className="cd-input capitalize text-primary font-bold bg-primary/5" defaultValue={user?.role || "client"} disabled />
                    </div>

                    <div className="pt-4 border-t border-border/50">
                        <p className="text-xs text-text-muted mb-4">
                            Note: Profile editing functionality will be fully activated in an upcoming platform update.
                        </p>
                        <button className="cd-btn-primary opacity-50 cursor-not-allowed" disabled>
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
