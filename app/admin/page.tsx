import { redirect } from "next/navigation";

import { defaultAdminPath } from "@/lib/admin/navigation";

export default function AdminPage() {
  redirect(defaultAdminPath);
}
