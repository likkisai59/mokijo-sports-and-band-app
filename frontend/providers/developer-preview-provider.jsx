"use client";

import * as React from "react";
import { isDevMode } from "@/utils/dev-mode";

const DeveloperPreviewContext = React.createContext(null);

export function DeveloperPreviewProvider({ children }) {
  const [state, setState] = React.useState({
    previewRole: null,
    isPreviewMode: false,
    isHydrated: false,
  });

  React.useEffect(() => {
    if (!isDevMode()) {
      setState({
        previewRole: null,
        isPreviewMode: false,
        isHydrated: true,
      });
      return;
    }
    const enabled = localStorage.getItem("dev_preview_enabled") === "true";
    const role = localStorage.getItem("dev_preview_role");
    if (enabled && role) {
      setState({
        previewRole: role,
        isPreviewMode: true,
        isHydrated: true,
      });
    } else {
      setState({
        previewRole: null,
        isPreviewMode: false,
        isHydrated: true,
      });
    }
  }, []);

  function setPreview(role) {
    if (role) {
      localStorage.setItem("dev_preview_enabled", "true");
      localStorage.setItem("dev_preview_role", role);
      document.cookie = "dev_preview_enabled=true; path=/; max-age=86400;";
      document.cookie = `dev_preview_role=${role}; path=/; max-age=86400;`;
      setState({
        previewRole: role,
        isPreviewMode: true,
        isHydrated: true,
      });
    } else {
      exitPreview();
    }
  }

  function exitPreview() {
    localStorage.removeItem("dev_preview_enabled");
    localStorage.removeItem("dev_preview_role");
    document.cookie = "dev_preview_enabled=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "dev_preview_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    setState({
      previewRole: null,
      isPreviewMode: false,
      isHydrated: true,
    });
  }

  return (
    <DeveloperPreviewContext.Provider
      value={{
        previewRole: state.previewRole,
        isPreviewMode: state.isPreviewMode,
        isHydrated: state.isHydrated,
        setPreview,
        exitPreview,
      }}
    >
      {children}
    </DeveloperPreviewContext.Provider>
  );
}

export function useDeveloperPreview() {
  const context = React.useContext(DeveloperPreviewContext);
  if (!context) {
    throw new Error("useDeveloperPreview must be used within a DeveloperPreviewProvider");
  }
  return context;
}
