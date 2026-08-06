"use client";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import CustomRoleRegistration from "@/components/register/CustomRoleRegistration";
import SuccessScreen from "@/components/register/SuccessScreen";
import {
    AuthShell,
    AuthCard,
    AuthBrand,
    AuthField,
    AuthErrorBanner,
    getAuthClasses,
} from "@/components/auth";
import Link from "next/link";

const c = getAuthClasses("light");

const roles = [
    {
        value: "Player",
        title: "Player / Athlete",
        description: "Join a group/team in a sports club. Fill in your player details.",
    },
    {
        value: "Parent",
        title: "Parent / Guardian",
        description: "Register your children and manage emergency contacts.",
    },
    {
        value: "Coach",
        title: "Coach / Trainer",
        description: "Apply to coach teams, view schedules, and manage sessions.",
    },
    {
        value: "Referee",
        title: "Referee / Match Official",
        description: "Register as an official to referee club tournaments and matches.",
    },
];

export default function RegisterMemberPage() {
    const [clubs, setClubs] = useState([]);
    const [selectedClub, setSelectedClub] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [loadingClubs, setLoadingClubs] = useState(true);
    const [clubError, setClubError] = useState("");
    const [pendingClubId, setPendingClubId] = useState("");
    const [clubDropdownOpen, setClubDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchClubs = async () => {
            setLoadingClubs(true);
            setClubError("");
            try {
                const response = await fetch(`${API_BASE_URL}/clubs`);
                if (!response.ok) throw new Error("Could not load clubs.");
                const data = await response.json();
                setClubs(data || []);
                if (!data || data.length === 0) {
                    setClubError("No clubs are available for member registration yet.");
                }
            } catch {
                setClubError("Could not load the club list. Please try again.");
            } finally {
                setLoadingClubs(false);
            }
        };
        fetchClubs();
    }, []);

    function handleClubSubmit(event) {
        event.preventDefault();
        const clubId = Number(pendingClubId);
        const club = clubs.find((item) => item.id === clubId);
        if (!club) {
            setClubError("Please select a club to continue.");
            return;
        }
        setSelectedClub(club);
        setSelectedRole(null);
        setClubError("");
        setClubDropdownOpen(false);
    }

    function resetToClubStep() {
        setSelectedClub(null);
        setSelectedRole(null);
    }

    return (
        <AuthShell variant="light">
            <AuthCard size="register" variant="light">
                <Link href="/" className={c.backLink}>
                    ← Back to Home
                </Link>

                <AuthBrand
                    variant="light"
                    align="center"
                    title="Member Registration"
                    subtitle="Join a club as a player, parent, coach, or referee"
                />

                {submitted ? (
                    <SuccessScreen role={selectedRole} />
                ) : selectedClub === null ? (
                    <>
                        <h2 className="text-xl font-semibold text-gray-900 tracking-tight text-center">
                            Select The Club You Want To Join
                        </h2>
                        <p className="text-sm text-gray-500 text-center -mt-2">
                            Choose your club before continuing registration.
                        </p>

                        <AuthErrorBanner variant="light">{clubError}</AuthErrorBanner>

                        <form className="flex flex-col gap-4 items-center w-full" onSubmit={handleClubSubmit}>
                            <AuthField variant="light" label="Club" required>
                                <div className="relative w-full max-w-[380px] mx-auto">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!loadingClubs && clubs.length > 0) {
                                                setClubDropdownOpen((open) => !open);
                                            }
                                        }}
                                        disabled={loadingClubs || clubs.length === 0}
                                        className={`${c.input} flex items-center justify-between text-left disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        <span className={pendingClubId ? "text-gray-900 font-semibold" : "text-gray-400"}>
                                            {loadingClubs
                                                ? "Loading clubs..."
                                                : (() => {
                                                    const clubMatch = clubs.find(
                                                        (club) => club.id === Number(pendingClubId)
                                                    );
                                                    if (!clubMatch) return "Choose your club...";
                                                    const cid =
                                                        clubMatch.club_id || `MKJ-${String(clubMatch.id).padStart(3, "0")}`;
                                                    return `${cid} - ${clubMatch.club_name}`;
                                                })()}
                                        </span>
                                        <span className="text-gray-700 font-bold">▾</span>
                                    </button>

                                    {clubDropdownOpen ? (
                                        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-20 max-h-[220px] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
                                            {clubs.map((club) => {
                                                const cid =
                                                    club.club_id || `MKJ-${String(club.id).padStart(3, "0")}`;
                                                const selected = Number(pendingClubId) === club.id;
                                                return (
                                                    <button
                                                        type="button"
                                                        key={club.id}
                                                        onClick={() => {
                                                            setPendingClubId(String(club.id));
                                                            setClubDropdownOpen(false);
                                                        }}
                                                        className={`w-full px-3.5 py-2.5 border-none border-b border-gray-100 text-left text-sm cursor-pointer ${selected
                                                            ? "bg-gray-100 text-gray-900 font-bold"
                                                            : "bg-transparent text-gray-700 hover:bg-gray-50"
                                                            }`}
                                                    >
                                                        {cid} - {club.club_name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : null}
                                </div>
                            </AuthField>

                            <button
                                type="submit"
                                className={c.primaryBtn}
                                disabled={loadingClubs || clubs.length === 0 || !pendingClubId}
                            >
                                Continue
                            </button>
                        </form>
                    </>
                ) : selectedRole === null ? (
                    <div className="flex flex-col gap-4 items-center w-full">
                        <button type="button" className={c.backLink} onClick={resetToClubStep}>
                            ← Back to Clubs
                        </button>

                        <h2 className="text-xl font-semibold text-gray-900 tracking-tight text-center">
                            How Do You Want To Continue?
                        </h2>
                        <p className="text-sm text-gray-500 text-center -mt-2">
                            Registering for {selectedClub.club_name}. Select your onboarding type.
                        </p>

                        <div className="flex flex-col gap-3 mt-2 w-full max-w-[380px] mx-auto">
                            {roles.map((role) => (
                                <button
                                    type="button"
                                    key={role.value}
                                    onClick={() => setSelectedRole(role.value)}
                                    className="text-left p-4 rounded-xl bg-white border-2 border-gray-200 hover:border-black hover:bg-gray-50 transition-all"
                                >
                                    <strong className="block text-gray-900 text-base">{role.title}</strong>
                                    <span className="block text-sm text-gray-500 mt-1">{role.description}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <CustomRoleRegistration
                        role={selectedRole}
                        selectedClub={selectedClub}
                        onBack={() => setSelectedRole(null)}
                        backLabel="← Back to Type"
                        onComplete={() => setSubmitted(true)}
                    />
                )}
            </AuthCard>
        </AuthShell>
    );
}
