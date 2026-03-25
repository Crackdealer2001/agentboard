"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DevAppPage() {
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("dev_session");
    if (!stored) {
      router.replace("/dev");
      return;
    }
    router.replace("/scope/new");
  }, [router]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>Loading...</p>
    </div>
  );
}
