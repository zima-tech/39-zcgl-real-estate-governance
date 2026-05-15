import { redirect } from "next/navigation";

import { AuditLogsPage } from "@/app/admin/_components/audit-logs-page";
import { listAuditLogs } from "@/lib/admin/audit-log";
import { requireAdminSession } from "@/lib/admin/auth";
import { adminRoutes } from "@/lib/admin/routes";

export default async function AdminSystemAuditLogsPage() {
  const session = await requireAdminSession();

  if (session.user.roleKey === "user") {
    redirect(adminRoutes.systemUsers);
  }

  const logs = await listAuditLogs();

  return <AuditLogsPage initialLogs={logs} />;
}
