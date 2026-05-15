import { UserManagementPage } from "@/app/admin/_components/user-management-page";
import { listAdminUsers } from "@/lib/admin/system-service";

export default async function AdminSystemUsersPage() {
  const initialUsers = await listAdminUsers();

  return <UserManagementPage initialUsers={initialUsers} />;
}
