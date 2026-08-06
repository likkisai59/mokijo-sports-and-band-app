"use client";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getAuthClasses } from "@/components/auth";
import { countries, getStatesForCountry, memberOptions, sportsOptions } from "./constants";
import {
    isValidClubName,
    CLUB_NAME_MESSAGE,
    generateClubId,
    applyClubNameInput,
} from "@/lib/validation";

const c = getAuthClasses("light");
const fieldErrorStyle = { color: "#ef4444", fontSize: "12px", marginTop: "6px", marginBottom: 0 };

export default function Step1({ formData, onChange, onNext }) {
    const stateList = getStatesForCountry(formData.country);
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState("");

    useEffect(() => {
        if (!formData.clubId) {
            fetch(`${API_BASE_URL}/clubs`)
                .then((res) => res.json())
                .then((clubs) => {
                    const count = (clubs || []).length + 1;
                    onChange("clubId", generateClubId(count));
                })
                .catch(() => {
                    onChange("clubId", generateClubId(1));
                });
        }
    }, []);

    function handleCountryChange(value) {
        onChange("country", value);
        onChange("state", "");
    }

    function handleClubNameChange(raw) {
        const { sanitized, error } = applyClubNameInput(raw);
        onChange("clubName", sanitized);
        setFieldErrors((prev) => ({ ...prev, clubName: error }));
        setFormError("");
    }

    function handleNext() {
        const nextErrors = {};
        if (!formData.clubName?.trim()) {
            nextErrors.clubName = "Club name is required.";
        } else if (!isValidClubName(formData.clubName)) {
            nextErrors.clubName = CLUB_NAME_MESSAGE;
        }

        if (
            !formData.country ||
            !formData.state ||
            !formData.memberCount ||
            !formData.sport ||
            (Array.isArray(formData.sport) && formData.sport.length === 0)
        ) {
            setFormError("Please fill in all fields before continuing.");
            setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
            return;
        }

        if (Object.keys(nextErrors).length) {
            setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
            setFormError("");
            return;
        }

        setFormError("");
        onNext();
    }

    return (
        <div className="flex flex-col gap-6 w-full items-center">
            <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-black text-white">1</div>
                <div className="flex-1 h-px bg-gray-200 max-w-[60px]"></div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 border border-gray-300 text-gray-500">2</div>
            </div>

            <div className="text-center mb-4">
                <h2 className="text-2xl font-black text-black tracking-tight">Club Information</h2>
                <p className="text-sm font-medium text-gray-600 mt-1">Tell us about your club or organisation</p>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                <label className={c.label}>Club Name *</label>
                <input
                    type="text"
                    className={c.input}
                    placeholder="Enter your club name"
                    value={formData.clubName}
                    onChange={(e) => handleClubNameChange(e.target.value)}
                />
                {fieldErrors.clubName ? <p style={fieldErrorStyle}>{fieldErrors.clubName}</p> : null}
            </div>

            <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                <label className={c.label}>
                    Club ID <span className="text-xs text-gray-500 ml-1 font-normal">(Auto-Generated)</span>
                </label>
                <input
                    type="text"
                    className={c.input}
                    value={formData.clubId || "Auto-generating..."}
                    readOnly
                />
            </div>

            <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                <label className={c.label}>Country *</label>
                <select
                    className={c.select}
                    value={formData.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                >
                    <option value="">-- Select Country --</option>
                    {countries.map((country) => (
                        <option key={country} value={country}>
                            {country}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                <label className={c.label}>State *</label>
                {stateList ? (
                    <select
                        className={c.select}
                        value={formData.state}
                        onChange={(e) => onChange("state", e.target.value)}
                    >
                        <option value="">-- Select State --</option>
                        {stateList.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        type="text"
                        className={c.input}
                        placeholder={formData.country ? "Enter state / province" : "Select a country first"}
                        value={formData.state}
                        onChange={(e) => onChange("state", e.target.value)}
                        disabled={!formData.country}
                    />
                )}
            </div>

            <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                <label className={c.label}>Number of Members *</label>
                <select
                    className={c.select}
                    value={formData.memberCount}
                    onChange={(e) => onChange("memberCount", e.target.value)}
                >
                    <option value="">-- Select Member Range --</option>
                    {memberOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-[380px] mx-auto text-left">
                <label className={c.label}>Sports / Activities * (Select all that apply)</label>
                <div className="max-h-[180px] overflow-y-auto border-2 border-gray-300 rounded-xl p-3 bg-gray-50 flex flex-col gap-2 w-full max-w-[380px] mx-auto">
                    {sportsOptions.map((sport) => {
                        const selectedSports = Array.isArray(formData.sport) ? formData.sport : [];
                        const isChecked = selectedSports.includes(sport);
                        return (
                            <label
                                key={sport}
                                className="flex items-center gap-2.5 cursor-pointer text-sm text-black font-bold"
                            >
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                        let updated;
                                        if (e.target.checked) {
                                            updated = [...selectedSports, sport];
                                        } else {
                                            updated = selectedSports.filter((s) => s !== sport);
                                        }
                                        onChange("sport", updated);
                                    }}
                                    className="w-4 h-4 accent-black cursor-pointer"
                                />
                                <span>{sport}</span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {formError ? <p style={fieldErrorStyle}>{formError}</p> : null}

            <div className="flex justify-end items-center mt-6 w-full max-w-[380px] mx-auto">
                <button
                    type="button"
                    className="h-10 px-6 bg-black text-white font-bold text-sm rounded-xl transition-all duration-200 hover:bg-gray-800 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    onClick={handleNext}
                >
                    Next Step →
                </button>
            </div>
        </div>
    );
}
