export type AdminRoleKey =
  | "root"
  | "admin"
  | "data_intake_operator"
  | "document_operator"
  | "workflow_approver"
  | "risk_analyst"
  | "scenario_tester"
  | "user";

export type AdminUserStatus = "system" | "active";

export type AdminRole = {
  key: AdminRoleKey;
  label: string;
  summary: string;
  permissionScope: string[];
  protectionNote: string;
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
  memberCount?: number;
};

export type AdminUser = {
  id: string;
  username: string;
  displayName: string;
  roleKey: AdminRoleKey;
  status: AdminUserStatus;
  statusLabel: string;
  isProtected: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
};

export type AdminSessionUser = {
  id: string;
  username: string;
  displayName: string;
  roleKey: AdminRoleKey;
};

export type CreateAdminUserInput = {
  username: string;
  displayName: string;
  password: string;
  roleKey: Exclude<AdminRoleKey, "root">;
};

export const builtInRoles: AdminRole[] = [
  {
    key: "root",
    label: "root",
    summary: "系统保留超级账号，负责平台初始化与最高级别治理。",
    permissionScope: [
      "访问全部后台模块和系统级配置",
      "保留对基础账号与安全策略的最终控制权",
      "在当前阶段不参与普通创建、删除和角色变更流程",
    ],
    protectionNote: "root 是系统保留角色，不支持删除或编辑。",
    isSystem: true,
  },
  {
    key: "admin",
    label: "admin",
    summary: "后台管理员角色，负责日常运营和系统管理操作。",
    permissionScope: [
      "查看并维护后台基础配置",
      "创建普通后台用户并执行常规维护操作",
      "不能删除系统保留的 root 账号或修改内置角色体系",
    ],
    protectionNote: "admin 是固定内置角色，本阶段仅展示权限说明。",
    isSystem: true,
  },
  {
    key: "data_intake_operator",
    label: "数据采集员",
    summary: "负责房产与企业治理业务的源数据录入、基础字段维护和重复数据初筛。",
    permissionScope: [
      "创建和更新治理业务记录",
      "查看业务记录聚合详情和字段校验结果",
      "根据重复检测提示处理源数据质量问题",
    ],
    protectionNote: "治理业务内置角色，可分配给负责资料采集的一线人员。",
    isSystem: true,
  },
  {
    key: "document_operator",
    label: "资料经办员",
    summary: "负责 DOCX、图片、Excel 等材料上传、模板下载和上传校验结果处理。",
    permissionScope: [
      "下载治理业务模板和测试结果模板",
      "上传 DOCX、图片、Excel 材料并保存元数据",
      "查看上传校验的通过、警告和拒绝原因",
    ],
    protectionNote: "治理业务内置角色，可分配给材料整理和流转人员。",
    isSystem: true,
  },
  {
    key: "workflow_approver",
    label: "流程审批员",
    summary: "负责治理业务在线审批节点、退回补正、转交、驳回和归档处置。",
    permissionScope: [
      "处理部门初审和归档复核节点",
      "执行通过、退回、转交、驳回和归档动作",
      "查看完整流程事件历史和节点提醒",
    ],
    protectionNote: "治理业务内置角色，可分配给线上审批人员。",
    isSystem: true,
  },
  {
    key: "risk_analyst",
    label: "风险分析员",
    summary: "负责风险复核、Mock AI 风险输出判读和治理预警处置建议确认。",
    permissionScope: [
      "处理风险复核节点",
      "查看数据治理检查和风险预警详情",
      "启动和解读 Mock AI 风险扫描结果",
    ],
    protectionNote: "治理业务内置角色，可分配给风控或合规人员。",
    isSystem: true,
  },
  {
    key: "scenario_tester",
    label: "场景测试员",
    summary: "负责启动、推进、复核和重置 fixture 驱动的智能化演示场景。",
    permissionScope: [
      "启动和推进场景模拟运行",
      "下载不同流程结果模板进行演示验收",
      "验证 Mock AI 边界、风险命中和流程结果展示",
    ],
    protectionNote: "治理业务内置角色，可分配给演示、验收和测试人员。",
    isSystem: true,
  },
  {
    key: "user",
    label: "user",
    summary: "基础协作角色，适合后续承接普通运营或审核账号。",
    permissionScope: [
      "用于承接受限后台访问和基础业务协作权限",
      "在当前演示阶段仅作为可分配角色展示",
      "不具备内置角色治理或系统保留账号管理权限",
    ],
    protectionNote: "user 是固定内置角色，本阶段仅展示权限说明。",
    isSystem: true,
  },
];

export const assignableRoleKeys: Array<Exclude<AdminRoleKey, "root">> = [
  "admin",
  "data_intake_operator",
  "document_operator",
  "workflow_approver",
  "risk_analyst",
  "scenario_tester",
  "user",
];

export const defaultRootAccount = {
  id: "root-account",
  username: "root",
  displayName: "系统 Root",
  roleKey: "root",
  status: "system",
  isProtected: true,
} as const;

export const defaultDevelopmentRootPassword = "root123456";

const roleOrder: AdminRoleKey[] = [
  "root",
  "admin",
  "data_intake_operator",
  "document_operator",
  "workflow_approver",
  "risk_analyst",
  "scenario_tester",
  "user",
];

export function getRoleByKey(roleKey: AdminRoleKey) {
  return builtInRoles.find((role) => role.key === roleKey) ?? builtInRoles[0];
}

export function sortRoleKeys(left: AdminRoleKey, right: AdminRoleKey) {
  return roleOrder.indexOf(left) - roleOrder.indexOf(right);
}

export function isAdminRoleKey(value: string): value is AdminRoleKey {
  return roleOrder.includes(value as AdminRoleKey);
}

export function isAssignableRoleKey(
  value: string,
): value is Exclude<AdminRoleKey, "root"> {
  return assignableRoleKeys.includes(value as Exclude<AdminRoleKey, "root">);
}

export function getAdminRoleColor(roleKey: AdminRoleKey) {
  switch (roleKey) {
    case "root":
      return "volcano";
    case "admin":
      return "cyan";
    case "data_intake_operator":
      return "blue";
    case "document_operator":
      return "geekblue";
    case "workflow_approver":
      return "purple";
    case "risk_analyst":
      return "red";
    case "scenario_tester":
      return "lime";
    case "user":
      return "gold";
  }
}

export function getAdminUserStatusLabel(status: AdminUserStatus) {
  return status === "system" ? "系统内置" : "已创建";
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function formatAdminDate(value: Date | number | string | null) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(/\//g, "-");
}
