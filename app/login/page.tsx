import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/app/login/_components/login-form";
import { getAdminSession } from "@/lib/admin/auth";
import { adminRoutes } from "@/lib/admin/routes";
import { defaultDevelopmentRootPassword } from "@/lib/admin/system-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Zima Admin Login",
  description: "Zima demo management console login.",
};

export default async function LoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect(adminRoutes.home);
  }

  const developmentPasswordHint =
    process.env.NODE_ENV === "development" && !process.env.ADMIN_ROOT_PASSWORD
      ? defaultDevelopmentRootPassword
      : null;

  return (
    <main className="login-root">
      <section className="login-panel-wrap" aria-label="登录">
        <div className="login-brand-row">
          <span className="brand-mark">Z</span>
          <div>
            <span className="login-brand-title">Zima Admin</span>
            <span className="login-brand-subtitle">多业务管理后台</span>
          </div>
        </div>
        <LoginForm developmentPasswordHint={developmentPasswordHint} />
      </section>
    </main>
  );
}
