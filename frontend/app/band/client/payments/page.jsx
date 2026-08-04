"use client";

import { CreditCard, FileText } from "lucide-react";
import Link from "next/link";

export default function ClientPaymentsPage() {
    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div>
                <h1 className="cd-page-title flex items-center gap-2">
                    <CreditCard className="h-6.5 w-6.5 text-primary" />
                    Payments & Invoices
                </h1>
                <p className="cd-page-sub">
                    View your transaction history, download invoices, and manage payment methods.
                </p>
            </div>

            <div className="cd-card">
                <div className="cd-empty">
                    <div className="cd-empty-icon flex justify-center text-text-muted mb-4">
                        <FileText size={48} />
                    </div>
                    <div className="cd-empty-text font-bold text-lg text-text-primary">No Payment History</div>
                    <div className="cd-empty-sub text-sm text-text-muted max-w-md mx-auto mt-2">
                        You have not made any payments yet. When you successfully book an artist or venue, the transaction details will appear here.
                    </div>
                    <div className="flex justify-center mt-6">
                        <Link href="/band/client/bookings" className="cd-btn-primary" style={{ textDecoration: 'none' }}>
                            View Bookings
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
