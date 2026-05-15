export const authRoutes = {
  login: "/login",
} as const;

export const adminRoutes = {
  home: "/admin",
  system: "/admin/system",
  expense: "/admin/expense",
  governance: "/admin/governance",
  governanceScenariosPage: "/admin/governance/scenarios",
  governanceTemplatesPage: "/admin/governance/templates",
  governanceWarningsPage: "/admin/governance/warnings",
  governanceWorkflowPage: "/admin/governance/workflow",
  housingRecommendation: "/admin/housing-recommendation",
  apartmentFrontdesk: "/admin/apartment-frontdesk",
  systemUsers: "/admin/system/users",
  systemRoles: "/admin/system/roles",
  systemAuditLogs: "/admin/system/audit-logs",
} as const;

export const authApiRoutes = {
  login: "/api/auth/login",
  logout: "/api/auth/logout",
  session: "/api/auth/session",
} as const;

export const adminApiRoutes = {
  governanceDashboard: "/api/admin/governance/dashboard",
  governanceAiJob: (recordId: string) =>
    `/api/admin/governance/records/${recordId}/ai-jobs`,
  governanceIntake: "/api/admin/governance/intake",
  governanceRecords: "/api/admin/governance/records",
  governanceRecordDetail: (recordId: string) =>
    `/api/admin/governance/records/${recordId}`,
  governanceRecordAction: (recordId: string) =>
    `/api/admin/governance/records/${recordId}/actions`,
  governanceRecordUpload: (recordId: string) =>
    `/api/admin/governance/records/${recordId}/uploads`,
  governanceScenarioAdvance: (runId: string) =>
    `/api/admin/governance/scenarios/${runId}/advance`,
  governanceScenarioReset: (runId: string) =>
    `/api/admin/governance/scenarios/${runId}/reset`,
  governanceScenarios: "/api/admin/governance/scenarios",
  governanceTemplateDownload: (templateKey: string) =>
    `/api/admin/governance/templates/${templateKey}`,
  governanceTemplates: "/api/admin/governance/templates",
  governanceWarnings: "/api/admin/governance/warnings",
  governanceWorkflowSubmit: (recordId: string) =>
    `/api/admin/governance/records/${recordId}/workflow`,
  governanceWorkflowTasks: "/api/admin/governance/workflow/tasks",
  users: "/api/admin/system/users",
  userDetail: (userId: string) => `/api/admin/system/users/${userId}`,
  roles: "/api/admin/system/roles",
  roleDetail: (roleKey: string) => `/api/admin/system/roles/${roleKey}`,
} as const;
