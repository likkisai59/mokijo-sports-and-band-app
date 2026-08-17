"use client";

import { useState, useEffect, useCallback } from "react";
import bandApi from "@/lib/bandApi";
import { CheckCircle2, XCircle, Loader2, Sparkles, AtSign } from "lucide-react";

export default function UsernameSelector({
    value = "",
    onChange,
    artistName = "",
    displayName = "",
    disabled = false,
}) {
    const [input, setInput] = useState(value ? value.replace(/^@/, "") : "");
    const [status, setStatus] = useState("idle"); // idle | checking | available | unavailable | error
    const [reason, setReason] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Sync external prop value
    useEffect(() => {
        if (value) {
            setInput(value.replace(/^@/, ""));
        }
    }, [value]);

    // Check username availability with debounce
    const checkAvailability = useCallback(async (rawUsername) => {
        const clean = rawUsername.replace(/^@/, "").trim();
        if (!clean) {
            setStatus("idle");
            setReason("");
            return;
        }

        if (clean.length < 3) {
            setStatus("unavailable");
            setReason("Must be at least 3 characters");
            return;
        }

        setStatus("checking");
        try {
            const res = await bandApi.post("/artists/username/check", { username: clean });
            if (res.data.available) {
                setStatus("available");
                setReason("Username is available!");
                if (onChange) onChange(clean);
            } else {
                setStatus("unavailable");
                setReason(res.data.reason || "Username is unavailable.");
            }
        } catch {
            setStatus("error");
            setReason("Could not verify username.");
        }
    }, [onChange]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (input) {
                checkAvailability(input);
            } else {
                setStatus("idle");
                setReason("");
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [input, checkAvailability]);

    // Fetch suggestions
    const fetchSuggestions = async () => {
        setLoadingSuggestions(true);
        try {
            const res = await bandApi.get("/artists/username/suggestions", {
                params: { name: artistName, display_name: displayName },
            });
            setSuggestions(res.data.suggestions || []);
        } catch {
            setSuggestions([]);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, [artistName, displayName]);

    const handleInputChange = (e) => {
        const val = e.target.value.replace(/^@/, "").toLowerCase().replace(/[^a-z0-9_]/g, "");
        setInput(val);
        if (onChange) onChange(val);
    };

    const handleSelectSuggestion = (sug) => {
        setInput(sug);
        if (onChange) onChange(sug);
        checkAvailability(sug);
    };

    return (
        <div className="space-y-2.5 w-full">
            <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#0a0a0f]">
                    Public Username <span className="text-red-600">*</span>
                </label>
                {status === "available" && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Available
                    </span>
                )}
                {status === "unavailable" && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        <XCircle className="w-3.5 h-3.5" /> {reason}
                    </span>
                )}
                {status === "checking" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking…
                    </span>
                )}
            </div>

            <div className="relative">
                <AtSign className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    disabled={disabled}
                    placeholder="yourname"
                    maxLength={30}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f7f7f8] border border-[rgba(10,10,15,0.12)] text-[#0a0a0f] text-sm font-medium focus:outline-none focus:border-[#c6ff3d] focus:ring-2 focus:ring-[#c6ff3d]/30 transition-all placeholder:text-gray-400"
                />
            </div>

            {input && (
                <p className="text-[11px] text-gray-500 font-medium">
                    Your public link: <span className="font-bold text-gray-900">bandconnect.com/@{input}</span>
                </p>
            )}

            {/* Username Suggestions */}
            {suggestions.length > 0 && (
                <div className="pt-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 mb-1.5">
                        <Sparkles className="w-3 h-3 text-[#10b981]" />
                        <span>Suggested usernames:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {suggestions.map((sug) => (
                            <button
                                key={sug}
                                type="button"
                                onClick={() => handleSelectSuggestion(sug)}
                                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                                    input === sug
                                        ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                                }`}
                            >
                                @{sug}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
