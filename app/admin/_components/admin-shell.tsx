"use client";

import {
  App,
  Breadcrumb,
  Button,
  Menu,
  type MenuProps,
  Space,
  Tag,
  Typography,
} from "antd";
import { usePathname, useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import { adminClient } from "@/lib/admin/client";
import {
  type AdminIconName,
  type AdminModule,
  defaultAdminPath,
  getActiveAdminNavigation,
  getAdminModulesForRole,
  getDefaultRouteForModule,
} from "@/lib/admin/navigation";
import { authRoutes } from "@/lib/admin/routes";
import type { AdminSessionUser } from "@/lib/admin/system-data";

type AdminShellProps = {
  children: React.ReactNode;
  sessionUser: AdminSessionUser;
};

type MenuItem = NonNullable<MenuProps["items"]>[number];

function RailIcon({ name }: { name: AdminIconName }) {
  const baseClassName = "h-4 w-4";

  switch (name) {
    case "chart":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={baseClassName}
        >
          <path d="M4 19.5h16" strokeLinecap="round" />
          <path d="M7 16v-5" strokeLinecap="round" />
          <path d="M12 16V6" strokeLinecap="round" />
          <path d="M17 16v-8" strokeLinecap="round" />
        </svg>
      );
    case "clipboard":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={baseClassName}
        >
          <path
            d="M8.5 4.5h7l.7 2h1.3A1.5 1.5 0 0 1 19 8v11.5A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5V8a1.5 1.5 0 0 1 1.5-1.5h1.3l.7-2Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M9 11h6M9 15h6" strokeLinecap="round" />
        </svg>
      );
    case "database":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={baseClassName}
        >
          <ellipse cx="12" cy="6" rx="7.5" ry="3.25" />
          <path d="M4.5 6v5c0 1.8 3.35 3.25 7.5 3.25s7.5-1.45 7.5-3.25V6" />
          <path d="M4.5 11v5c0 1.8 3.35 3.25 7.5 3.25s7.5-1.45 7.5-3.25v-5" />
        </svg>
      );
    case "fileCheck":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={baseClassName}
        >
          <path
            d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7.5 3.5Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M14 3.5V8h4" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="m9 14 2 2 4-4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "fileSignature":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={baseClassName}
        >
          <path
            d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7.5 3.5Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M14 3.5V8h4" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M8.5 15.5c1.5-3.2 3.1-3.2 3.2-.2.1 1.9 1.4 1.9 3.8-.1"
            strokeLinecap="round"
          />
        </svg>
      );
    case "home":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={baseClassName}
        >
          <path
            d="M4 11.2 12 4l8 7.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.5 10.5V20h11v-9.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 20v-5h4v5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "idCard":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={baseClassName}
        >
          <path
            d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v9A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-9Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M8 11h.01M12 10h4M12 14h3" strokeLinecap="round" />
          <path d="M7.5 14.5c.8-1 1.8-1 2.6 0" strokeLinecap="round" />
        </svg>
      );
    case "key":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={baseClassName}
        >
          <circle cx="8" cy="12" r="3.5" />
          <path d="M11.5 12H20" strokeLinecap="round" />
          <path d="M16 12v3" strokeLinecap="round" />
          <path d="M19 12v2" strokeLinecap="round" />
        </svg>
      );
    case "logOut":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={baseClassName}
        >
          <path
            d="M9 20H6.5A1.5 1.5 0 0 1 5 18.5v-13A1.5 1.5 0 0 1 6.5 4H9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13 16l4-4-4-4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M17 12H9" strokeLinecap="round" />
        </svg>
      );
    case "shield":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={baseClassName}
        >
          <path
            d="M12 3c2.6 2 5.6 3 9 3v5.7c0 4.8-3.5 8.9-9 10.3-5.5-1.4-9-5.5-9-10.3V6c3.4 0 6.4-1 9-3Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="m9.4 12 1.8 1.9 3.5-3.8" strokeLinecap="round" />
        </svg>
      );
    case "receipt":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={baseClassName}
        >
          <path
            d="M7 3.5h10a1 1 0 0 1 1 1v15.25a.25.25 0 0 1-.4.2L15 18l-2.6 1.95a.67.67 0 0 1-.8 0L9 18 6.4 19.95a.25.25 0 0 1-.4-.2V4.5a1 1 0 0 1 1-1Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M9 8.25h6" strokeLinecap="round" />
          <path d="M9 11.75h6" strokeLinecap="round" />
          <path d="M9 15.25h3.5" strokeLinecap="round" />
        </svg>
      );
    case "sparkles":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={baseClassName}
        >
          <path
            d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="m18 15 .9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15Z" />
          <path d="M6 14.5 6.6 16 8 16.6 6.6 17.2 6 18.5l-.6-1.3L4 16.6 5.4 16 6 14.5Z" />
        </svg>
      );
    case "building":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={baseClassName}
        >
          <path
            d="M5 21V5.5A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.5V21"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 10h3.5A1.5 1.5 0 0 1 20 11.5V21"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M3.5 21h17" strokeLinecap="round" />
          <path d="M8 8h1.5M8 12h1.5M8 16h1.5" strokeLinecap="round" />
          <path d="M11.5 8H13M11.5 12H13M11.5 16H13" strokeLinecap="round" />
          <path d="M17 14h1.5M17 17h1.5" strokeLinecap="round" />
        </svg>
      );
    case "tool":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={baseClassName}
        >
          <path
            d="M14.5 6.5a4.5 4.5 0 0 0 5.1 5.1l-7.9 7.9a2.2 2.2 0 0 1-3.1 0l-4.1-4.1a2.2 2.2 0 0 1 0-3.1l7.9-7.9Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="m7 13 4 4" strokeLinecap="round" />
        </svg>
      );
    case "upload":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={baseClassName}
        >
          <path d="M12 15V4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m8 8 4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M5 15.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "userCog":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={baseClassName}
        >
          <path d="M9.5 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
          <path
            d="M4 19c.6-3.2 2.5-5 5.5-5 1.2 0 2.2.3 3 .8"
            strokeLinecap="round"
          />
          <path
            d="M17.5 14.5v1.1M17.5 20.4v1.1M20.1 18h1.1M13.8 18h1.1"
            strokeLinecap="round"
          />
          <circle cx="17.5" cy="18" r="2.4" />
        </svg>
      );
    case "users":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={baseClassName}
        >
          <path d="M9.5 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
          <path
            d="M4 19c.6-3.2 2.5-5 5.5-5s4.9 1.8 5.5 5"
            strokeLinecap="round"
          />
          <path d="M16 11.5a2.6 2.6 0 1 0 0-5.2" strokeLinecap="round" />
          <path d="M18 18.5c1.1-.4 1.8-1.2 2-2.5" strokeLinecap="round" />
        </svg>
      );
  }
}

function getMenuKey(module: AdminModule, childKey?: string) {
  return childKey ? `${module.key}:${childKey}` : module.key;
}

function buildMenuItems(modules: AdminModule[]): MenuProps["items"] {
  return modules.map((adminModule): MenuItem => {
    if (adminModule.children?.length) {
      return {
        key: `group:${adminModule.key}`,
        label: adminModule.label,
        type: "group",
        children: adminModule.children.map((item) => ({
          key: getMenuKey(adminModule, item.key),
          icon: <RailIcon name={item.icon} />,
          label: item.label,
        })),
      };
    }

    return {
      key: getMenuKey(adminModule),
      icon: <RailIcon name={adminModule.icon} />,
      label: adminModule.label,
    };
  });
}

function resolveMenuPath(modules: AdminModule[], key: string) {
  for (const adminModule of modules) {
    if (key === getMenuKey(adminModule)) {
      return getDefaultRouteForModule(adminModule);
    }

    for (const child of adminModule.children ?? []) {
      if (key === getMenuKey(adminModule, child.key)) {
        return child.href;
      }
    }
  }

  return null;
}

export function AdminShell({ children, sessionUser }: AdminShellProps) {
  const { message } = App.useApp();
  const pathname = usePathname() ?? defaultAdminPath;
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const visibleModules = getAdminModulesForRole(sessionUser.roleKey);
  const hasVisibleModules = visibleModules.length > 0;
  const { module: activeModule, child: activeChild } = getActiveAdminNavigation(
    pathname,
    visibleModules,
  );
  const businessModules = visibleModules.filter(
    (adminModule) => adminModule.key !== "system-management",
  );
  const systemModules = visibleModules.filter(
    (adminModule) => adminModule.key === "system-management",
  );
  const selectedKey = activeChild
    ? getMenuKey(activeModule, activeChild.key)
    : getMenuKey(activeModule);
  const businessMenuItems = useMemo(
    () => buildMenuItems(businessModules),
    [businessModules],
  );
  const systemMenuItems = useMemo(
    () => buildMenuItems(systemModules),
    [systemModules],
  );
  const pageTitle = hasVisibleModules
    ? (activeChild?.label ?? activeModule.label)
    : "后台工作台";
  const pageDescription = hasVisibleModules
    ? activeChild
      ? `${activeModule.label} / ${activeChild.label}`
      : `${activeModule.label} 工作台`
    : "暂无模块";
  const breadcrumbItems = hasVisibleModules
    ? [
        { title: "后台工作台" },
        { title: activeModule.label },
        ...(activeChild ? [{ title: activeChild.label }] : []),
      ]
    : [{ title: "后台工作台" }];

  function handleMenuClick({ key }: { key: string }) {
    const nextPath = resolveMenuPath(visibleModules, key);

    if (nextPath) {
      router.push(nextPath);
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await adminClient.logout();

      startTransition(() => {
        router.replace(authRoutes.login);
        router.refresh();
      });
    } catch (error) {
      setIsLoggingOut(false);
      message.error(error instanceof Error ? error.message : "退出登录失败。");
    }
  }

  return (
    <div className="console-root">
      <aside className="console-sidebar">
        <div className="console-brand">
          <span className="brand-mark">Z</span>
          <div>
            <Typography.Text strong>Zima Admin</Typography.Text>
            <Typography.Text type="secondary" className="brand-subtitle">
              多业务管理后台
            </Typography.Text>
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={businessMenuItems}
          className="console-menu console-menu-business"
          onClick={handleMenuClick}
        />
        {systemMenuItems?.length ? (
          <>
            <div
              className="console-menu-divider"
              role="separator"
              aria-hidden="true"
            />
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={systemMenuItems}
              className="console-menu console-menu-system"
              onClick={handleMenuClick}
            />
          </>
        ) : null}
      </aside>

      <main className="console-main">
        <header className="console-header">
          <div className="min-w-0">
            <Breadcrumb items={breadcrumbItems} />
            <Typography.Title level={3} className="page-title">
              {pageTitle}
            </Typography.Title>
            <Typography.Text type="secondary">
              {pageDescription}
            </Typography.Text>
          </div>

          <Space wrap>
            <Tag color="blue" className="!mx-0">
              {sessionUser.displayName} / {sessionUser.roleKey}
            </Tag>
            {hasVisibleModules ? (
              <Button
                type="primary"
                onClick={() => router.push(defaultAdminPath)}
              >
                进入核心业务
              </Button>
            ) : null}
            <Button loading={isLoggingOut} onClick={handleLogout}>
              退出
            </Button>
          </Space>
        </header>

        <section className="console-content">{children}</section>
      </main>
    </div>
  );
}
