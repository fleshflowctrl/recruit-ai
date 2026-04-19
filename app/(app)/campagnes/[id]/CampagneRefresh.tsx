"use client";

import { useEffect } from "react";

export function CampagneRefresh() {
  useEffect(() => {
    const t = setInterval(() => {
      window.location.reload();
    }, 15000);
    return () => clearInterval(t);
  }, []);
  return null;
}
