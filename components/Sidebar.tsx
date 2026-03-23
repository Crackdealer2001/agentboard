"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DarkModeToggle from "./DarkModeToggle";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session?.user) {
        setEmail(data.session.user.email || "");
      }
    });
    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  const nav = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Projects", href: "/scope" },
    { label: "Settings", href: "/settings" },
  ];

  const sidebarStyle: React.CSSProperties = {
    width: 220,
    minHeight: "100vh",
    background: "var(--surface)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    padding: "24px 0",
    flexShrink: 0,
  };

  return (
    <aside style={sidebarStyle}>
      <div style={{ padding: "0 20px 24px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontWeight: 800, fontSize: 18, color: "var(--text)" }}>Scope</span>
      </div>
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <a key={item.href} href={item.href} style={{ display: "block", padding: "8px 12px", borderRadius: 8, fontSize: 14, fontWeight: active ? 600 : 400, color: active ? "var(--text)" : "var(--text3)", background: active ? "var(--bg3)" : "transparent", marginBottom: 2 }}>
              {item.label}
            </a>
          );
        })}
      </nav>
      <div style={{ padding: "12px 20px 8px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 12, color: "var(--text4)", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
        <DarkModeToggle />
        <button onClick={signOut} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 7, padding: "6px 12px", fontSize: 13, color: "var(--text3)", cursor: "pointer", width: "100%", marginTop: 8 }}>Sign out</button>
      </div>
    </aside>
  );
}
