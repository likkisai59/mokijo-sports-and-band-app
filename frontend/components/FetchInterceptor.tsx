"use client";

import { useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";

export default function FetchInterceptor() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;

    window.fetch = async function (input, init) {
      let url = "";
      if (typeof input === "string") {
        url = input;
      } else if (input && typeof input === "object" && "url" in input) {
        url = input.url;
      }

      const isBackendCall = url.includes(API_BASE_URL) || url.startsWith("/api");

      if (isBackendCall) {
        const isBandCall = url.includes("/band/");
        const token = localStorage.getItem(isBandCall ? "bandAccessToken" : "accessToken");
        if (token) {
          init = init || {};
          const headers = new Headers(init.headers || {});
          if (!headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${token}`);
          }
          init.headers = headers;
        }
      }

      const response = await originalFetch.call(this, input, init);

      if (response.status === 401 && isBackendCall) {
        const isBandCall = url.includes("/band/");

        if (isBandCall) {
          localStorage.removeItem("bandAccessToken");
          localStorage.removeItem("bandUserId");
          localStorage.removeItem("bandUserName");
          localStorage.removeItem("bandRole");
          localStorage.removeItem("bandEmail");
          const path = window.location.pathname;
          if (!path.includes("/band/login") && !path.includes("/band/register")) {
            window.location.href = "/band/login";
          }
          return response;
        }

        const isMember = localStorage.getItem("isMember") === "true" || localStorage.getItem("userRole") === "team_member";
        const isVenueOwner = localStorage.getItem("isVenueOwner") === "true";

        localStorage.removeItem("accessToken");
        localStorage.removeItem("userName");
        localStorage.removeItem("userId");
        localStorage.removeItem("clubName");
        localStorage.removeItem("isMember");
        localStorage.removeItem("isVenueOwner");
        localStorage.removeItem("venueOwnerId");
        localStorage.removeItem("venueOwnerName");
        localStorage.removeItem("userRole");
        localStorage.removeItem("memberId");
        localStorage.removeItem("memberRole");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userPhone");
        localStorage.removeItem("memberGroupName");
        localStorage.removeItem("approvalStatus");

        if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/register") && window.location.pathname !== "/") {
          if (isMember) {
            window.location.href = "/login-member";
          } else if (isVenueOwner) {
            window.location.href = "/login-venue";
          } else {
            window.location.href = "/login";
          }
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
