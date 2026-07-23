"use client";

import { Suspense } from "react";
import MemberSection from "../../../components/dashboard/MemberSection";

export default function MembersPage() {
    return (
        <div className="members-page-shell" style={{ margin: "-32px -48px -48px -48px" }}>
            <Suspense fallback={null}>
                <MemberSection />
            </Suspense>
        </div>
    );
}
