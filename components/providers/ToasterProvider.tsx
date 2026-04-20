"use client";

import { Toaster } from "react-hot-toast";

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: "text-[13px]",
        duration: 4000,
        style: {
          background: "var(--cream-text)",
          color: "var(--cream-bg)",
          borderRadius: "8px",
          boxShadow: "none",
        },
        success: {
          iconTheme: { primary: "var(--cream-bg)", secondary: "#1A5C2A" },
        },
        error: {
          iconTheme: { primary: "var(--cream-bg)", secondary: "#F5D9D9" },
        },
      }}
    />
  );
}
