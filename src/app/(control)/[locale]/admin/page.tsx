import type { Metadata } from "next";

import { AdminApp } from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "CONTROL CENTER — AjakStudio",
  robots: { index: false, follow: false, nocache: true },
};

/** `/{locale}/admin/` — the whole screen is client-rendered against the local store or Supabase. */
export default function AdminPage() {
  return <AdminApp />;
}
