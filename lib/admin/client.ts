import {
  getAdminErrorPayloadCode,
  getAdminErrorPayloadFieldErrors,
  getAdminErrorPayloadMessage,
} from "@/lib/admin/errors";
import type {
  CreateGovernanceIntakeInput,
  CreateGovernanceUploadInput,
  GovernanceAssetLedgerResponse,
  GovernanceDashboard,
  GovernanceEnterpriseAnalysisResponse,
  GovernanceTodoItem,
  GovernanceProcessor,
  GovernanceRecordDetail,
  GovernanceRecordSummary,
  GovernanceRiskWarning,
  GovernanceScenarioRun,
  GovernanceTemplate,
  GovernanceWorkflowActionInput,
  StartGovernanceAiJobInput,
  UpdateGovernanceRecordInput,
} from "@/lib/admin/governance-service";
import { adminApiRoutes, authApiRoutes, authRoutes } from "@/lib/admin/routes";
import type {
  AdminRole,
  AdminSessionUser,
  AdminUser,
  CreateAdminUserInput,
} from "@/lib/admin/system-data";

export class AdminClientError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly fieldErrors?: Record<string, string>,
    readonly code?: string,
  ) {
    super(message);
    this.name = "AdminClientError";
  }
}

const jsonHeaders = {
  "Content-Type": "application/json",
} as const;

function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.assign(authRoutes.login);
  }
}

async function requestJson<T>(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
  });
  const data = (await response.json().catch(() => null)) as T | null;

  if (!response.ok) {
    if (response.status === 401) {
      redirectToLogin();
      throw new AdminClientError("登录已失效，正在跳转到登录页。", 401);
    }

    throw new AdminClientError(
      getAdminErrorPayloadMessage(data) ?? "请求失败。",
      response.status,
      getAdminErrorPayloadFieldErrors(data),
      getAdminErrorPayloadCode(data),
    );
  }

  return data as T;
}

export type AdminLoginInput = {
  username: string;
  password: string;
};

export const adminClient = {
  login(input: AdminLoginInput) {
    return requestJson<{
      user: AdminSessionUser;
    }>(authApiRoutes.login, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(input),
    });
  },

  logout() {
    return requestJson<{
      success: boolean;
    }>(authApiRoutes.logout, {
      method: "POST",
    });
  },

  listGovernanceRecords() {
    return requestJson<{
      records: GovernanceRecordSummary[];
    }>(adminApiRoutes.governanceRecords);
  },

  getRealEstateAssetLedger() {
    return requestJson<GovernanceAssetLedgerResponse>(
      adminApiRoutes.governanceAssets,
    );
  },

  getEnterpriseGovernanceAnalysis() {
    return requestJson<GovernanceEnterpriseAnalysisResponse>(
      adminApiRoutes.governanceEnterpriseAnalysis,
    );
  },

  getGovernanceHomepageOverview() {
    return requestJson<{
      dashboard: GovernanceDashboard;
      todos: GovernanceTodoItem[];
    }>(adminApiRoutes.governanceHomepageOverview);
  },

  getGovernanceDashboard() {
    return requestJson<{
      dashboard: GovernanceDashboard;
    }>(adminApiRoutes.governanceDashboard);
  },

  getGovernanceRecordDetail(recordId: string) {
    return requestJson<{
      record: GovernanceRecordDetail;
    }>(adminApiRoutes.governanceRecordDetail(recordId));
  },

  createGovernanceIntake(input: CreateGovernanceIntakeInput) {
    return requestJson<{
      record: GovernanceRecordDetail;
    }>(adminApiRoutes.governanceIntake, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(input),
    });
  },

  updateGovernanceRecord(recordId: string, input: UpdateGovernanceRecordInput) {
    return requestJson<{
      record: GovernanceRecordDetail;
    }>(adminApiRoutes.governanceRecordDetail(recordId), {
      method: "PATCH",
      headers: jsonHeaders,
      body: JSON.stringify(input),
    });
  },

  createGovernanceUpload(
    recordId: string,
    input: CreateGovernanceUploadInput,
  ) {
    return requestJson<{
      record: GovernanceRecordDetail;
      uploadId: string;
    }>(adminApiRoutes.governanceRecordUpload(recordId), {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(input),
    });
  },

  listGovernanceTemplates() {
    return requestJson<{
      templates: GovernanceTemplate[];
    }>(adminApiRoutes.governanceTemplates);
  },

  downloadGovernanceTemplate(templateKey: string) {
    return requestJson<{
      content: string;
      filename: string;
      template: GovernanceTemplate;
    }>(adminApiRoutes.governanceTemplateDownload(templateKey));
  },

  submitGovernanceWorkflow(recordId: string) {
    return requestJson<{
      record: GovernanceRecordDetail;
    }>(adminApiRoutes.governanceWorkflowSubmit(recordId), {
      method: "POST",
    });
  },

  applyGovernanceWorkflowAction(
    recordId: string,
    input: GovernanceWorkflowActionInput,
  ) {
    return requestJson<{
      record: GovernanceRecordDetail;
    }>(adminApiRoutes.governanceRecordAction(recordId), {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(input),
    });
  },

  startGovernanceAiJob(recordId: string, input: StartGovernanceAiJobInput) {
    return requestJson<{
      jobId: string;
      record: GovernanceRecordDetail;
    }>(adminApiRoutes.governanceAiJob(recordId), {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(input),
    });
  },

  pollGovernanceAiJobs(recordId: string) {
    return requestJson<{
      processors: GovernanceProcessor[];
      record: GovernanceRecordDetail;
    }>(adminApiRoutes.governanceAiJob(recordId));
  },

  listGovernanceWarnings() {
    return requestJson<{
      warnings: GovernanceRiskWarning[];
    }>(adminApiRoutes.governanceWarnings);
  },

  listGovernanceWorkflowTasks() {
    return requestJson<{
      tasks: Array<{
        assigneeRole: string;
        createdAt: string;
        currentNodeName: string;
        recordId: string;
        recordTitle: string;
        status: string;
      }>;
    }>(adminApiRoutes.governanceWorkflowTasks);
  },

  listGovernanceScenarioRuns() {
    return requestJson<{
      runs: GovernanceScenarioRun[];
      bundles: Array<{ key: string; label: string; steps: string[] }>;
    }>(adminApiRoutes.governanceScenarios);
  },

  startGovernanceScenarioRun(bundleKey: string) {
    return requestJson<{
      record: GovernanceRecordDetail;
      run: GovernanceScenarioRun;
    }>(adminApiRoutes.governanceScenarios, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ bundleKey }),
    });
  },

  advanceGovernanceScenarioRun(runId: string) {
    return requestJson<{
      record: GovernanceRecordDetail;
      run: GovernanceScenarioRun;
    }>(adminApiRoutes.governanceScenarioAdvance(runId), {
      method: "POST",
    });
  },

  resetGovernanceScenarioRun(runId: string) {
    return requestJson<{
      run: GovernanceScenarioRun;
    }>(adminApiRoutes.governanceScenarioReset(runId), {
      method: "POST",
    });
  },

  listUsers() {
    return requestJson<{
      users: AdminUser[];
    }>(adminApiRoutes.users);
  },

  getUserDetail(userId: string) {
    return requestJson<{
      user: AdminUser;
    }>(adminApiRoutes.userDetail(userId));
  },

  createUser(input: CreateAdminUserInput) {
    return requestJson<{
      user: AdminUser;
    }>(adminApiRoutes.users, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify(input),
    });
  },

  deleteUser(userId: string) {
    return requestJson<{
      deletedUserId: string;
      deletedUsername: string;
    }>(adminApiRoutes.userDetail(userId), {
      method: "DELETE",
    });
  },

  listRoles() {
    return requestJson<{
      roles: AdminRole[];
    }>(adminApiRoutes.roles);
  },

  getRoleDetail(roleKey: string) {
    return requestJson<{
      role: AdminRole;
    }>(adminApiRoutes.roleDetail(roleKey));
  },
};
