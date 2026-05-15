import type { Metadata } from "next";

import { AdminShell } from "@/app/admin/_components/admin-shell";
import { requireAdminSession } from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Workspace",
  description:
    "Protected admin workspace backed by Turso persistence and server-side sessions.",
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAdminSession();

  return <AdminShell sessionUser={session.user}>{children}</AdminShell>;
}
