import { adminRoutes } from "@/lib/admin/routes";
import type { AdminRoleKey } from "@/lib/admin/system-data";

export type AdminIconName =
  | "building"
  | "chart"
  | "clipboard"
  | "database"
  | "fileCheck"
  | "fileSignature"
  | "home"
  | "idCard"
  | "key"
  | "logOut"
  | "receipt"
  | "sparkles"
  | "shield"
  | "tool"
  | "upload"
  | "userCog"
  | "users";

export type AdminSubmenuItem = {
  key: string;
  label: string;
  href: string;
  icon: AdminIconName;
};

export type AdminModule = {
  key: string;
  label: string;
  icon: AdminIconName;
  href: string;
  children?: AdminSubmenuItem[];
};

export { adminRoutes };

export const adminModules: AdminModule[] = [
  {
    key: "governance",
    label: "治理业务",
    icon: "building",
    href: adminRoutes.governance,
    children: [
      {
        key: "records",
        label: "业务记录",
        href: adminRoutes.governance,
        icon: "database",
      },
      {
        key: "templates",
        label: "模板上传",
        href: adminRoutes.governanceTemplatesPage,
        icon: "upload",
      },
      {
        key: "workflow",
        label: "流程待办",
        href: adminRoutes.governanceWorkflowPage,
        icon: "clipboard",
      },
      {
        key: "warnings",
        label: "风险预警",
        href: adminRoutes.governanceWarningsPage,
        icon: "shield",
      },
      {
        key: "scenarios",
        label: "场景模拟",
        href: adminRoutes.governanceScenariosPage,
        icon: "sparkles",
      },
    ],
  },
  {
    key: "system-management",
    label: "系统管理",
    icon: "shield",
    href: adminRoutes.systemUsers,
    children: [
      {
        key: "users",
        label: "用户管理",
        href: adminRoutes.systemUsers,
        icon: "userCog",
      },
      {
        key: "roles",
        label: "权限管理",
        href: adminRoutes.systemRoles,
        icon: "shield",
      },
      {
        key: "audit-logs",
        label: "日志审计",
        href: adminRoutes.systemAuditLogs,
        icon: "clipboard",
      },
    ],
  },
];

export const defaultAdminPath = adminRoutes.systemUsers;

export function getDefaultRouteForModule(module: AdminModule) {
  return module.children?.[0]?.href ?? module.href;
}

export function getAdminModulesForRole(roleKey: AdminRoleKey) {
  if (roleKey !== "user") {
    return adminModules;
  }

  return adminModules
    .filter(
      (module) =>
        module.key !== "housing-recommendation" &&
        module.key !== "governance" &&
        module.key !== "apartment-frontdesk",
    )
    .map((module) => {
      if (module.key === "system-management") {
        const visibleChildren = module.children?.filter(
          (item) => item.key !== "audit-logs",
        );

        return {
          ...module,
          href: visibleChildren?.[0]?.href ?? module.href,
          children: visibleChildren,
        };
      }

      return module;
    });
}

export function getActiveAdminNavigation(
  pathname: string,
  modules: AdminModule[] = adminModules,
) {
  for (const adminModule of modules) {
    const exactChild =
      adminModule.children?.find((item) => pathname === item.href) ?? null;
    const activeChild =
      exactChild ??
      adminModule.children
        ?.filter((item) => pathname.startsWith(`${item.href}/`))
        .sort((left, right) => right.href.length - left.href.length)[0] ??
      null;

    if (activeChild) {
      return {
        module: adminModule,
        child: activeChild,
      };
    }

    if (
      pathname === adminModule.href ||
      pathname.startsWith(`${adminModule.href}/`)
    ) {
      return {
        module: adminModule,
        child: adminModule.children?.[0] ?? null,
      };
    }
  }

  return {
    module: modules[0],
    child: null,
  };
}
