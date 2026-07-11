"use client";
import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8001";

export default function PayoutsPage() {
    const [venues, setVenues]     = useState([]);
    const [payouts, setPayouts]   = useState(null);
    const [selVenue, setSelVenue] = useState(null);
    const [loading, setLoading]   = useState(false);

    useEffect(() => {
        const ownerId = localStorage.getItem("venueOwnerId");
        if (!ownerId) return;
        fetch(`${API}/venue-owner/${ownerId}/venues`)
            .then(r => r.ok ? r.json() : [])
            .then(data => { setVenues(data); if (data.length > 0) setSelVenue(data[0].id); });
    }, []);

    useEffect(() => {
        if (!selVenue) return;
        setLoading(true);
        fetch(`${API}/venues/${selVenue}/payouts`)
            .then(r => r.ok ? r.json() : null)
            .then(setPayouts)
            .catch(() => setPayouts(null))
            .finally(() => setLoading(false));
    }, [selVenue]);

    function statusBadge(s) {
        if (s === "transferred") return <span className="vd-badge green">Transferred</span>;
        if (s === "processing")  return <span className="vd-badge yellow">Processing</span>;
        return <span className="vd-badge gray">{s}</span>;
    }

    return (
        <>
            <h1 className="vd-page-title">Payouts</h1>
            <p className="vd-page-sub">Revenue summary and payout history</p>

            <div className="vd-controls" style={{ marginBottom: 24 }}>
                <select className="vd-select" value={selVenue || ""} onChange={e => setSelVenue(Number(e.target.value))}>
                    {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="vd-loading"><div className="vd-spinner" /> Loading payouts…</div>
            ) : !payouts ? (
                <div className="vd-card">
                    <div className="vd-empty">
                        <div className="vd-empty-icon">💰</div>
                        <div className="vd-empty-text">No payout data available</div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="vd-payout-row">
                        <div className="vd-payout-card">
                            <div className="vd-payout-amount">₹{payouts.total_revenue.toLocaleString()}</div>
                            <div className="vd-payout-label">Total Revenue</div>
                        </div>
                        <div className="vd-payout-card">
                            <div className="vd-payout-amount" style={{ color: "#f87171" }}>
                                ₹{payouts.platform_fee.toLocaleString()}
                            </div>
                            <div className="vd-payout-label">Platform Fee (10%)</div>
                        </div>
                        <div className="vd-payout-card">
                            <div className="vd-payout-amount" style={{ color: "#4ade80" }}>
                                ₹{payouts.final_payout.toLocaleString()}
                            </div>
                            <div className="vd-payout-label">Your Net Payout (90%)</div>
                        </div>
                    </div>

                    <div className="vd-card">
                        <div className="vd-card-header">
                            <span className="vd-card-title">Payout History</span>
                        </div>
                        {payouts.payout_history.length === 0 ? (
                            <div className="vd-empty">
                                <div className="vd-empty-text">No payouts recorded yet</div>
                            </div>
                        ) : (
                            <div className="vd-table-wrap">
                                <table className="vd-table">
                                    <thead>
                                        <tr>
                                            <th>Payout ID</th>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>UTR / Ref</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payouts.payout_history.map(p => (
                                            <tr key={p.id}>
                                                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{p.id}</td>
                                                <td>{p.date}</td>
                                                <td style={{ color: "#4ade80", fontWeight: 600 }}>₹{p.amount.toLocaleString()}</td>
                                                <td>{statusBadge(p.status)}</td>
                                                <td style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{p.utr}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    );
}
