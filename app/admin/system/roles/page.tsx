import { RoleManagementPage } from "@/app/admin/_components/role-management-page";
import { listAdminRoles } from "@/lib/admin/system-service";

export default async function AdminSystemRolesPage() {
  const initialRoles = await listAdminRoles();

  return <RoleManagementPage initialRoles={initialRoles} />;
}
