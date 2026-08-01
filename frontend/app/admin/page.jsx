"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

export default function AdminRootPage() {
  const router = useRouter();

  React.useEffect(() => {
    // Redirect to default nested admin dashboard route
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-bg-primary">
      <Spinner size="lg" />
    </div>
  );
}
