import { redirect } from "next/navigation";

import { adminRoutes } from "@/lib/admin/routes";

export default function Home() {
  redirect(adminRoutes.home);
}
