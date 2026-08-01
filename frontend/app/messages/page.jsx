"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function GlobalMessagesRedirect() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const roleName = user.role || (user.roles && user.roles[0]?.name);
      if (roleName) {
        const role = roleName.toLowerCase();
        let prefix = "client";
        if (role === "artist") {
          prefix = "artist";
        } else if (role === "venue_owner" || role === "venue") {
          prefix = "venue";
        } else if (role === "admin") {
          prefix = "admin";
        }
        router.replace(`/${prefix}/messages`);
      } else {
        router.replace("/login");
      }
    } else {
      router.replace("/login");
    }
  }, [user, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-bg-primary text-text-primary">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        <span className="text-xs text-text-secondary font-bold">Opening messages...</span>
      </div>
    </div>
  );
}
