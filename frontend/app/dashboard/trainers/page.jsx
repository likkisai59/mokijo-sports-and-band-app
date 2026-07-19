"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, MapPin, Search, Sparkles, UserRound } from "lucide-react";
import api from "../../../lib/api";

export default function TrainersPage() {
    const [trainers, setTrainers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadTrainers = async () => {
            try {
                const response = await api.get("/courses");
                const courses = response.data || [];
                const trainersFromCourses = courses
                    .filter((course) => course.instructor)
                    .map((course) => ({
                        id: course.id,
                        name: course.instructor,
                        specialty: course.title,
                        experience: course.category || "Training",
                        location: course.location || "Online / On-site",
                        availability: course.schedule || "Schedule shared on request",
                    }));

                setTrainers(trainersFromCourses);
            } catch (err) {
                console.error("Failed to load trainers:", err);
                setError("Unable to load trainers right now.");
            } finally {
                setLoading(false);
            }
        };

        loadTrainers();
    }, []);

    const filteredTrainers = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return trainers;

        return trainers.filter((trainer) => {
            const haystack = [trainer.name, trainer.specialty, trainer.experience, trainer.location].join(" ").toLowerCase();
            return haystack.includes(query);
        });
    }, [search, trainers]);

    return (
        <div style={{ padding: "24px", color: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                <div>
                    <div style={{ color: "#bffe00", fontSize: "12px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "6px" }}>
                        Parent & Guardian Hub
                    </div>
                    <h1 style={{ margin: 0, fontSize: "28px" }}>Trainers</h1>
                    <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.75)", maxWidth: "720px" }}>
                        Discover coaches and training sessions available for your child or group.
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    <Sparkles size={16} color="#bffe00" />
                    <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.9)" }}>Trusted sessions</span>
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", marginBottom: "18px" }}>
                <Search size={16} color="rgba(255,255,255,0.7)" />
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search trainers, programs, or locations"
                    style={{ background: "transparent", border: "none", outline: "none", color: "#fff", width: "100%" }}
                />
            </div>

            {error && <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(248,113,113,0.14)", color: "#fecaca", marginBottom: "16px" }}>{error}</div>}

            {loading ? (
                <div style={{ padding: "20px", borderRadius: "16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    Loading trainers...
                </div>
            ) : filteredTrainers.length === 0 ? (
                <div style={{ padding: "24px", borderRadius: "16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", textAlign: "center" }}>
                    <UserRound size={32} style={{ marginBottom: "10px", color: "#bffe00" }} />
                    <h3 style={{ margin: "0 0 6px" }}>No trainers available yet</h3>
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.7)" }}>Try a different search term or check back later.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gap: "14px" }}>
                    {filteredTrainers.map((trainer) => (
                        <div key={trainer.id} style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
                                <div>
                                    <div style={{ fontSize: "12px", color: "#bffe00", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "4px" }}>
                                        {trainer.experience}
                                    </div>
                                    <h3 style={{ margin: "0 0 4px", fontSize: "18px" }}>{trainer.name}</h3>
                                    <p style={{ margin: 0, color: "rgba(255,255,255,0.8)" }}>{trainer.specialty}</p>
                                </div>
                                <div style={{ padding: "8px 10px", borderRadius: "999px", background: "rgba(191,254,0,0.14)", color: "#bffe00", fontSize: "12px", fontWeight: 700 }}>
                                    Available
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginTop: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.75)", fontSize: "13px" }}>
                                    <MapPin size={14} /> {trainer.location}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.75)", fontSize: "13px" }}>
                                    <Clock3 size={14} /> {trainer.availability}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.75)", fontSize: "13px" }}>
                                    <CalendarDays size={14} /> Book a session
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
