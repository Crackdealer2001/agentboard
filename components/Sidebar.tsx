"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { email?: string } | null } }) => {
      if (data.user) setEmail(data.user.email || "");
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const nav = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Projects", href: "/scope" },
    { label: "Settings", href: "/settings" },
  ];

  const sidebarStyle: React.CSSProperties = {
    width: 220,
    minHeight: "100vh",
    background: "#ffffff",
    borderRight: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    padding: "24px 0",
    flexShrink: 0,
  };

  return (
    <aside style={sidebarStyle}>
      <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #e5e7eb" }}>
        <span style={{ fontWeight: 800, fontSize: 18, color: "#0a0a0a" }}>Scope</span>
      </div>
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <a key={item.href} href={item.href} style={{ display: "block", padding: "8px 12px", borderRadius: 8, fontSize: 14, fontWeight: active ? 600 : 400, color: active ? "#0a0a0a" : "#6b7280", background: active ? "#f3f4f6" : "transparent", marginBottom: 2 }}>
              {item.label}
            </a>
          );
        })}
      </nav>
      <div style={{ padding: "16px 20px", borderTop: "1px solid #e5e7eb" }}>
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
        <button onClick={signOut} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 7, padding: "6px 12px", fontSize: 13, color: "#6b7280", cursor: "pointer", width: "100%" }}>Sign out</button>
      </div>
    </aside>
  );
}
