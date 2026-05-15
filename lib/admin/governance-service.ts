import { randomUUID } from "node:crypto";

import { and, asc, desc, eq, ne } from "drizzle-orm";

import { createAdminAuditActor, recordAuditLog } from "@/lib/admin/audit-log";
import { AdminServiceError, AdminValidationError } from "@/lib/admin/errors";
import { formatAdminDate, type AdminSessionUser } from "@/lib/admin/system-data";
import { db } from "@/lib/db/client";
import { ensureAdminDatabase } from "@/lib/db/ensure-admin-database";
import {
  governanceAiJobsTable,
  governanceFinalOutcomesTable,
  governanceFindingsTable,
  governanceImportBatchesTable,
  governanceRecordsTable,
  governanceRemindersTable,
  governanceRiskWarningsTable,
  governanceScenarioRunsTable,
  governanceTemplatesTable,
  governanceUploadsTable,
  governanceWorkflowEventsTable,
  governanceWorkflowInstancesTable,
  type GovernanceActorType,
  type GovernanceAiJobStatus,
  type GovernanceMockScenarioSource,
  type GovernanceRecordStatus,
  type GovernanceRiskSeverity,
  type GovernanceScenarioRunStatus,
  type GovernanceSourceType,
  type GovernanceUploadCategory,
  type GovernanceWorkflowStatus,
} from "@/lib/db/schema";

export type { GovernanceSourceType };

export type GovernanceMockScenarioId =
  | "normal-success"
  | "missing-fields"
  | "data-conflict"
  | "risk-warning"
  | "manual-review"
  | "rejection"
  | "corrected-archive";

export type GovernanceWorkflowAction =
  | "approve"
  | "archive"
  | "correct"
  | "reject"
  | "return"
  | "transfer";

export type GovernanceNormalizedFields = {
  assessedValueTenThousand?: number;
  businessType: string;
  contactPhone?: string;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
  entityName: string;
  enterpriseComplianceStatus?: GovernanceEnterpriseComplianceStatus;
  enterpriseGovernanceRating?: string;
  enterpriseGovernanceScore?: number;
  enterpriseRegistrationNumber?: string;
  enterpriseRemediationFocus?: string[];
  leaseExpiryDate?: string;
  locationLabel?: string;
  ownerName: string;
  ownershipStatus?: string;
  propertyAddress: string;
  propertyAreaSqm?: number;
  propertyNumber?: string;
  propertyType?: string;
  registrationNo: string;
  rentOverdueAmountTenThousand?: number;
  riskNote?: string;
  tenantName?: string;
};

export type GovernanceAssetRiskLevel = "low" | "medium" | "high" | "critical";

export type GovernanceLeaseExpiryStatus =
  | "active"
  | "expired"
  | "expiring_soon"
  | "not_applicable";

export type GovernanceEnterpriseComplianceStatus =
  | "attention"
  | "blocked"
  | "normal"
  | "remediation";

export type GovernanceAssetLedgerItem = GovernanceRecordSummary & {
  assessedValueTenThousand: number;
  coordinateStatus: "address_only" | "coordinates";
  coordinates: GovernanceNormalizedFields["coordinates"];
  leaseExpiryDate: string | null;
  leaseExpiryStatus: GovernanceLeaseExpiryStatus;
  locationLabel: string;
  ownershipRiskIndicator: {
    label: string;
    source: "mock-derived" | "rule-based";
  };
  ownershipStatus: string;
  propertyAreaSqm: number;
  propertyNumber: string;
  propertyType: string;
  rentOverdueIndicator: {
    amountTenThousand: number;
    label: string;
    source: "mock-derived" | "rule-based";
  };
  riskLevel: GovernanceAssetRiskLevel;
  tenantName: string;
  valueAssessment: {
    label: string;
    source: "mock-derived" | "rule-based";
    sourceFields: string[];
  };
  workflowStatus: GovernanceRecordStatus;
};

export type GovernanceMapDistributionGroup = {
  addressOnlyCount: number;
  coordinateCount: number;
  locationLabel: string;
  ownershipStatusCounts: Record<string, number>;
  recordCount: number;
  riskCounts: Record<GovernanceAssetRiskLevel, number>;
};

export type GovernanceAssetLedgerFilters = {
  leaseExpiryStatuses: GovernanceLeaseExpiryStatus[];
  ownershipStatuses: string[];
  propertyTypes: string[];
  riskLevels: GovernanceAssetRiskLevel[];
  tenants: string[];
  workflowStatuses: GovernanceRecordStatus[];
};

export type GovernanceAssetLedgerResponse = {
  assets: GovernanceAssetLedgerItem[];
  filters: GovernanceAssetLedgerFilters;
  mapDistribution: GovernanceMapDistributionGroup[];
};

export type GovernanceEnterpriseLedgerItem = GovernanceRecordSummary & {
  approvalState: string;
  completenessStatus: "complete" | "missing_required_fields";
  complianceStatus: GovernanceEnterpriseComplianceStatus;
  duplicateFindingCount: number;
  governanceRating: string;
  governanceScore: number;
  mockAiIndicatorCount: number;
  openWarningCount: number;
  registrationNumber: string;
  remediationFocus: string[];
  responsibleParty: string;
  workflowState: string;
};

export type GovernanceEnterpriseAnalysis = {
  attentionRecords: number;
  averageScore: number;
  completeRecords: number;
  duplicateFindings: number;
  mockAiIndicators: number;
  openWarnings: number;
  pendingApproval: number;
  remediationRecords: number;
  totalEnterprises: number;
};

export type GovernanceRemediationFocusGroup = {
  items: Array<{
    source: string;
    summary: string;
  }>;
  recordId: string;
  recordTitle: string;
};

export type GovernanceEnterpriseAnalysisResponse = {
  analysis: GovernanceEnterpriseAnalysis;
  enterprises: GovernanceEnterpriseLedgerItem[];
  remediationFocus: GovernanceRemediationFocusGroup[];
};

export type GovernanceTodoItem = {
  action: string;
  priority: "critical" | "high" | "medium" | "normal";
  recordId: string;
  recordTitle: string;
  sourceType:
    | "expiring_lease"
    | "missing_field"
    | "mock_ai_review"
    | "reminder"
    | "risk_warning"
    | "workflow";
  summary: string;
};

export type GovernanceRecordSummary = {
  activeWarningCount: number;
  batchId: string | null;
  businessType: string;
  createdAt: string;
  entityName: string;
  finalOutcomeReason: string | null;
  finalOutcomeSource: string | null;
  finalOutcomeStatus: string | null;
  id: string;
  mockScenarioId: string;
  mockScenarioSource: GovernanceMockScenarioSource;
  originalFilename: string | null;
  ownerName: string;
  pendingReminder: string | null;
  propertyAddress: string;
  sourceType: GovernanceSourceType;
  status: GovernanceRecordStatus;
  title: string;
  updatedAt: string;
  uploadCount: number;
};

export type GovernanceFinding = {
  createdAt: string;
  details: string;
  id: string;
  isBlocking: boolean;
  kind: string;
  severity: string;
  status: string;
  summary: string;
};

export type GovernanceUpload = {
  category: GovernanceUploadCategory;
  createdAt: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  id: string;
  templateKey: string | null;
  uploaderName: string;
  validationMessages: string[];
  validationStatus: "accepted" | "warning" | "rejected";
};

export type GovernanceWorkflowEvent = {
  action: string;
  actorDisplayName: string;
  actorType: GovernanceActorType;
  createdAt: string;
  id: string;
  reason: string | null;
  result: string;
  step: string;
  summary: string;
};

export type GovernanceWorkflowInstance = {
  assigneeRole: string;
  assigneeUserId: string | null;
  completedAt: string | null;
  currentNodeKey: string;
  currentNodeName: string;
  id: string;
  status: GovernanceWorkflowStatus;
  submittedAt: string;
  updatedAt: string;
};

export type GovernanceReminder = {
  createdAt: string;
  id: string;
  resolvedAt: string | null;
  status: string;
  summary: string;
  type: string;
};

export type GovernanceAiJob = {
  completedAt: string | null;
  completesAt: string;
  createdAt: string;
  delayMs: number;
  id: string;
  inputReference: string;
  mockSource: string;
  outputPayload: Record<string, unknown> | null;
  outputSummary: string | null;
  processorName: string;
  riskIndicators: string[];
  status: GovernanceAiJobStatus;
};

export type GovernanceRiskWarning = {
  createdAt: string;
  id: string;
  reason: string;
  recordId: string;
  relatedJobId: string | null;
  remediationHint: string;
  severity: GovernanceRiskSeverity;
  source: string;
  status: string;
  updatedAt: string;
};

export type GovernanceTemplate = {
  allowedExtensions: string[];
  auditEnabled: boolean;
  category: GovernanceUploadCategory;
  description: string;
  filename: string;
  key: string;
  label: string;
  maxSizeMb: number;
  requiredFields: string[];
  scenarioKey: string;
};

export type GovernanceProcessor = {
  delayMs: number;
  description: string;
  name: string;
  outputSummary: string;
  riskIndicators: string[];
};

export type GovernanceScenarioRun = {
  bundleKey: string;
  completedAt: string | null;
  createdAt: string;
  currentStep: number;
  id: string;
  label: string;
  status: GovernanceScenarioRunStatus;
  totalSteps: number;
  updatedAt: string;
};

export type GovernanceRecordDetail = GovernanceRecordSummary & {
  aiEvidence: Record<string, unknown> | null;
  aiJobs: GovernanceAiJob[];
  findings: GovernanceFinding[];
  normalizedFields: GovernanceNormalizedFields;
  reminders: GovernanceReminder[];
  riskWarnings: GovernanceRiskWarning[];
  uploads: GovernanceUpload[];
  workflowEvents: GovernanceWorkflowEvent[];
  workflowInstance: GovernanceWorkflowInstance | null;
};

export type GovernanceDashboard = {
  activeWarnings: number;
  aiJobsProcessing: number;
  assets: number;
  enterpriseRecords: number;
  expiringLeases: number;
  missingRequiredFields: number;
  mockAiReviewItems: number;
  records: number;
  templateCount: number;
  todoItems: number;
  uploads: number;
  workflowPending: number;
};

export type CreateGovernanceRecordInput = {
  manualFields?: Partial<GovernanceNormalizedFields>;
  mockScenarioId?: string;
  originalFilename?: string;
  sourceType: GovernanceSourceType;
};

export type CreateGovernanceIntakeInput = CreateGovernanceRecordInput;

export type UpdateGovernanceRecordInput = {
  fields: Partial<GovernanceNormalizedFields>;
};

export type CreateGovernanceUploadInput = {
  category: GovernanceUploadCategory;
  fileName: string;
  fileSize: number;
  templateKey?: string;
};

export type GovernanceWorkflowActionInput = {
  assigneeUserId?: string;
  correctedFields?: Partial<GovernanceNormalizedFields>;
  reason?: string;
  workflowAction: GovernanceWorkflowAction;
};

export type StartGovernanceAiJobInput = {
  inputReference?: string;
  processorName: string;
};

type ScenarioDefinition = {
  aliases: string[];
  aiEvidence: {
    confidence: number;
    evidence: string[];
    extractedFields: Partial<GovernanceNormalizedFields>;
    explanation: string;
  };
  defaultFinalOutcome: "approved" | "archived" | "rejected" | "escalated";
  label: string;
  routing: "approval" | "correction" | "review" | "risk";
  validationFindings: Array<{
    details: string;
    isBlocking: boolean;
    kind: string;
    severity: GovernanceRiskSeverity;
    summary: string;
  }>;
};

type ScenarioBundle = {
  label: string;
  scenarioId: GovernanceMockScenarioId;
  sourceType: GovernanceSourceType;
  originalFilename: string;
  steps: string[];
};

const identityFields = ["entityName", "registrationNo"] as const;

const baseFields: GovernanceNormalizedFields = {
  assessedValueTenThousand: 12800,
  businessType: "不动产治理备案",
  contactPhone: "13800000000",
  coordinates: {
    lat: 31.2397,
    lng: 121.4998,
  },
  entityName: "青岚置业有限公司",
  enterpriseComplianceStatus: "normal",
  enterpriseGovernanceRating: "A",
  enterpriseGovernanceScore: 92,
  enterpriseRegistrationNumber: "91310000MA1K00001A",
  enterpriseRemediationFocus: [],
  leaseExpiryDate: "2026-08-31",
  locationLabel: "上海浦东",
  ownerName: "周序",
  ownershipStatus: "自持",
  propertyAddress: "上海市浦东新区银城路 88 号 18 层",
  propertyAreaSqm: 1860,
  propertyNumber: "RE-2026-001",
  propertyType: "办公",
  registrationNo: "GOV-2026-0514",
  rentOverdueAmountTenThousand: 0,
  tenantName: "青岚城市服务",
};

export const governanceMockScenarios: Record<
  GovernanceMockScenarioId,
  ScenarioDefinition
> = {
  "normal-success": {
    aliases: ["normal", "success", "governance-normal", "normal-success"],
    aiEvidence: {
      confidence: 0.96,
      evidence: ["识别到完整权属信息", "业务类型与登记编号格式匹配"],
      explanation: "模拟识别结果完整，字段置信度达到自动校验阈值。",
      extractedFields: baseFields,
    },
    defaultFinalOutcome: "approved",
    label: "正常通过",
    routing: "approval",
    validationFindings: [],
  },
  "missing-fields": {
    aliases: ["missing", "missing-fields", "field-missing"],
    aiEvidence: {
      confidence: 0.62,
      evidence: ["权属人字段清晰", "登记编号区域缺失"],
      explanation: "模拟识别缺少登记编号，需要人工补全后继续。",
      extractedFields: {
        ...baseFields,
        registrationNo: "",
      },
    },
    defaultFinalOutcome: "archived",
    label: "字段缺失",
    routing: "correction",
    validationFindings: [
      {
        details: "登记编号为空，系统保留原始识别结果并等待人工补正。",
        isBlocking: false,
        kind: "completeness",
        severity: "warning",
        summary: "登记编号缺失",
      },
    ],
  },
  "data-conflict": {
    aliases: ["conflict", "data-conflict", "owner-conflict"],
    aiEvidence: {
      confidence: 0.81,
      evidence: ["正文权属人为周序", "附件表格权属人为韩骁"],
      explanation: "模拟识别发现多源字段不一致，需进入人工复核。",
      extractedFields: {
        ...baseFields,
        ownerName: "周序 / 韩骁",
      },
    },
    defaultFinalOutcome: "escalated",
    label: "数据冲突",
    routing: "review",
    validationFindings: [
      {
        details: "源文件正文与附表中的权属人不一致，自动流转被阻断。",
        isBlocking: true,
        kind: "consistency",
        severity: "critical",
        summary: "权属人信息冲突",
      },
    ],
  },
  "risk-warning": {
    aliases: ["risk", "risk-warning", "warning"],
    aiEvidence: {
      confidence: 0.9,
      evidence: ["抵押备注命中风险词", "历史处置记录存在未关闭事项"],
      explanation: "模拟识别命中风险提示，需完成风险复核。",
      extractedFields: {
        ...baseFields,
        registrationNo: "GOV-2026-RISK",
        riskNote: "历史抵押事项待核验",
      },
    },
    defaultFinalOutcome: "escalated",
    label: "风险预警",
    routing: "risk",
    validationFindings: [
      {
        details: "历史抵押事项未完全关闭，建议人工核验后再归档。",
        isBlocking: true,
        kind: "risk_warning",
        severity: "warning",
        summary: "存在待核验风险提示",
      },
    ],
  },
  "manual-review": {
    aliases: ["review", "manual-review", "human-review"],
    aiEvidence: {
      confidence: 0.74,
      evidence: ["主体名称可识别", "资料用途需要业务人员确认"],
      explanation: "模拟规则要求人工复核后决定后续处理。",
      extractedFields: {
        ...baseFields,
        registrationNo: "GOV-2026-REVIEW",
      },
    },
    defaultFinalOutcome: "archived",
    label: "人工复核",
    routing: "review",
    validationFindings: [
      {
        details: "业务用途与资料类型需要人工确认。",
        isBlocking: true,
        kind: "manual_review",
        severity: "warning",
        summary: "需要人工复核",
      },
    ],
  },
  rejection: {
    aliases: ["reject", "rejection", "rejected"],
    aiEvidence: {
      confidence: 0.88,
      evidence: ["资料主体不在授权名单", "归集用途与登记用途不一致"],
      explanation: "模拟规则给出默认驳回结果，仍需人工记录原因。",
      extractedFields: {
        ...baseFields,
        registrationNo: "GOV-2026-REJECT",
      },
    },
    defaultFinalOutcome: "rejected",
    label: "默认驳回",
    routing: "review",
    validationFindings: [
      {
        details: "主体授权材料不匹配，默认建议驳回。",
        isBlocking: true,
        kind: "rejection_recommendation",
        severity: "critical",
        summary: "资料不满足归档条件",
      },
    ],
  },
  "corrected-archive": {
    aliases: ["corrected", "corrected-archive", "manual-corrected"],
    aiEvidence: {
      confidence: 0.67,
      evidence: ["地址字段存在旧楼栋号", "登记编号可识别"],
      explanation: "模拟规则要求人工修正地址后归档。",
      extractedFields: {
        ...baseFields,
        propertyAddress: "上海市浦东新区银城路 88 号旧址",
        registrationNo: "GOV-2026-FIX",
      },
    },
    defaultFinalOutcome: "archived",
    label: "修正后归档",
    routing: "correction",
    validationFindings: [
      {
        details: "地址字段疑似旧址，需要人工修正后继续归档。",
        isBlocking: false,
        kind: "stale_information",
        severity: "warning",
        summary: "地址需要修正",
      },
    ],
  },
};

export const governanceScenarioOptions = Object.entries(
  governanceMockScenarios,
).map(([value, scenario]) => ({
  label: scenario.label,
  value,
}));

export const governanceTemplateRegistry: GovernanceTemplate[] = [
  {
    allowedExtensions: [".docx"],
    auditEnabled: true,
    category: "docx",
    description: "用于提交不动产权属、企业治理说明和审批说明材料。",
    filename: "real-estate-governance-intake.docx",
    key: "real-estate-docx-intake",
    label: "不动产治理材料 DOCX 模板",
    maxSizeMb: 12,
    requiredFields: ["entityName", "ownerName", "propertyAddress"],
    scenarioKey: "real-estate-governance",
  },
  {
    allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    auditEnabled: true,
    category: "image",
    description: "用于上传现场照片、证照扫描件和风险佐证图片。",
    filename: "governance-image-evidence-guide.png",
    key: "governance-image-evidence",
    label: "图片佐证上传规范",
    maxSizeMb: 8,
    requiredFields: ["recordId", "imagePurpose"],
    scenarioKey: "governance-evidence",
  },
  {
    allowedExtensions: [".xls", ".xlsx"],
    auditEnabled: true,
    category: "excel",
    description: "用于批量提交企业主体、不动产地址和治理状态清单。",
    filename: "enterprise-governance-register.xlsx",
    key: "enterprise-excel-register",
    label: "企业治理清单 Excel 模板",
    maxSizeMb: 20,
    requiredFields: ["entityName", "registrationNo", "businessType"],
    scenarioKey: "enterprise-governance",
  },
  {
    allowedExtensions: [".docx"],
    auditEnabled: true,
    category: "docx",
    description: "用于下载审批通过流程的智能化结果说明和归档意见。",
    filename: "workflow-approved-result.docx",
    key: "workflow-approved-result",
    label: "审批通过结果模板",
    maxSizeMb: 5,
    requiredFields: ["recordId", "workflowNode", "approvalComment"],
    scenarioKey: "workflow-result-approved",
  },
  {
    allowedExtensions: [".docx"],
    auditEnabled: true,
    category: "docx",
    description: "用于下载驳回或退回流程的原因、补正项和重新提交建议。",
    filename: "workflow-return-reject-result.docx",
    key: "workflow-return-reject-result",
    label: "退回驳回结果模板",
    maxSizeMb: 5,
    requiredFields: ["recordId", "rejectReason", "correctionItems"],
    scenarioKey: "workflow-result-rejected",
  },
  {
    allowedExtensions: [".xlsx"],
    auditEnabled: true,
    category: "excel",
    description: "用于下载风险复核流程的预警清单、严重级别和处置建议。",
    filename: "risk-review-result.xlsx",
    key: "risk-review-result",
    label: "风险复核结果模板",
    maxSizeMb: 8,
    requiredFields: ["warningId", "severity", "remediationHint"],
    scenarioKey: "risk-review-result",
  },
  {
    allowedExtensions: [".xlsx"],
    auditEnabled: true,
    category: "excel",
    description: "用于下载场景测试验收结果，展示每一步的 Mock AI 智能化输出。",
    filename: "scenario-intelligence-test-result.xlsx",
    key: "scenario-intelligence-test-result",
    label: "智能化场景测试结果模板",
    maxSizeMb: 8,
    requiredFields: ["scenarioRunId", "step", "mockAiResult", "expectedOutcome"],
    scenarioKey: "scenario-test-result",
  },
];

export const governanceProcessors: GovernanceProcessor[] = [
  {
    delayMs: 1400,
    description: "模拟从 DOCX、图片或 Excel 中抽取主体、权属人、地址和登记编号。",
    name: "ownership-extraction",
    outputSummary: "Mock AI 已抽取主体、权属与登记字段。",
    riskIndicators: [],
  },
  {
    delayMs: 1800,
    description: "模拟比对正文、附表和存量记录，输出一致性结论。",
    name: "document-consistency-review",
    outputSummary: "Mock AI 已完成多源一致性审查。",
    riskIndicators: ["owner_conflict"],
  },
  {
    delayMs: 2200,
    description: "模拟识别抵押、历史处置、缺失资料和人工复核风险。",
    name: "risk-scan",
    outputSummary: "Mock AI 已生成风险扫描摘要。",
    riskIndicators: ["mortgage_pending", "manual_review_required"],
  },
  {
    delayMs: 900,
    description: "模拟生成可归档的业务摘要和处置边界说明。",
    name: "archive-summary",
    outputSummary: "Mock AI 已生成归档摘要。",
    riskIndicators: [],
  },
];

function buildTemplateContent(template: GovernanceTemplate) {
  const commonHeader = [
    template.label,
    `文件名: ${template.filename}`,
    `适用场景: ${template.scenarioKey}`,
    `字段: ${template.requiredFields.join(", ")}`,
    `说明: ${template.description}`,
    "",
  ];

  switch (template.key) {
    case "workflow-approved-result":
      return [
        ...commonHeader,
        "流程结果: 审批通过 / 归档完成",
        "智能化摘要: Mock AI 已综合主体、权属、地址、登记编号和上传材料一致性，建议进入归档复核。",
        "下载测试: 该模板用于验证审批通过场景的结果文件。",
      ].join("\n");
    case "workflow-return-reject-result":
      return [
        ...commonHeader,
        "流程结果: 退回补正 / 驳回",
        "智能化摘要: Mock AI 与规则检查识别出缺失字段、主体不一致或授权材料不匹配，并生成补正建议。",
        "下载测试: 该模板用于验证退回、驳回场景的不同结果文件。",
      ].join("\n");
    case "risk-review-result":
      return [
        ...commonHeader,
        "流程结果: 风险复核",
        "智能化摘要: Mock AI 风险扫描命中抵押待核验、人工复核或多源冲突指标，系统生成严重级别和处置提示。",
        "下载测试: 该模板用于验证风险预警流程的结果文件。",
      ].join("\n");
    case "scenario-intelligence-test-result":
      return [
        ...commonHeader,
        "测试目标: 展示资料归集、上传校验、流程流转、Mock AI 处理、风险预警的端到端智能化演示。",
        "智能化摘要: 每个场景步骤都会保留运行 ID、Mock AI 处理器名称、确定性输出摘要、风险指标和预期结果。",
        "下载测试: 该模板用于验收不同场景运行产生的差异化结果。",
      ].join("\n");
    default:
      return [
        ...commonHeader,
        "下载测试: 该模板用于业务上传和基础校验演示。",
      ].join("\n");
  }
}

export const governanceScenarioBundles: Record<string, ScenarioBundle> = {
  "real-estate-risk-review": {
    label: "不动产风险复核闭环",
    originalFilename: "risk-warning.xlsx",
    scenarioId: "risk-warning",
    sourceType: "excel",
    steps: ["资料归集", "上传佐证", "提交审批", "Mock AI 风险扫描", "预警复核"],
  },
  "enterprise-missing-field": {
    label: "企业治理字段补正",
    originalFilename: "missing-fields.docx",
    scenarioId: "missing-fields",
    sourceType: "docx",
    steps: ["资料归集", "模板上传", "提交审批", "人工补正", "归档复核"],
  },
};

let governanceSeedPromise: Promise<void> | null = null;

function isGovernanceSourceType(value: string): value is GovernanceSourceType {
  return ["docx", "excel", "image", "manual", "word"].includes(value);
}

function isGovernanceUploadCategory(
  value: string,
): value is GovernanceUploadCategory {
  return ["docx", "excel", "image"].includes(value);
}

function isGovernanceMockScenarioId(
  value: string,
): value is GovernanceMockScenarioId {
  return value in governanceMockScenarios;
}

function getProcessor(name: string) {
  return governanceProcessors.find((processor) => processor.name === name);
}

function normalizeMarker(value: string | undefined | null) {
  return value?.trim().toLowerCase().replace(/\.[^.]+$/, "") ?? "";
}

function resolveScenarioByMarker(value: string | undefined | null) {
  const marker = normalizeMarker(value);

  if (!marker) {
    return null;
  }

  if (isGovernanceMockScenarioId(marker)) {
    return marker;
  }

  return (
    Object.entries(governanceMockScenarios).find(([, scenario]) =>
      scenario.aliases.includes(marker),
    )?.[0] as GovernanceMockScenarioId | undefined
  ) ?? null;
}

export function resolveGovernanceMockScenario(input: {
  filename?: string | null;
  marker?: string | null;
  sourceType: GovernanceSourceType;
}) {
  if (input.marker) {
    const scenarioId = resolveScenarioByMarker(input.marker);

    return {
      scenarioId: scenarioId ?? "normal-success",
      scenarioSource: input.sourceType === "manual" ? "manual" : "parameter",
    } as const;
  }

  if (input.filename && input.sourceType !== "manual") {
    const scenarioId = resolveScenarioByMarker(input.filename);

    if (scenarioId) {
      return {
        scenarioId,
        scenarioSource: "filename",
      } as const;
    }
  }

  return {
    scenarioId: "normal-success",
    scenarioSource: "fallback",
  } as const;
}

function getSourceTypeLabel(sourceType: GovernanceSourceType) {
  switch (sourceType) {
    case "docx":
    case "word":
      return "DOCX 导入";
    case "excel":
      return "Excel 导入";
    case "image":
      return "图片导入";
    case "manual":
      return "手动录入";
  }
}

export function getGovernanceStatusLabel(status: GovernanceRecordStatus) {
  switch (status) {
    case "intake_completed":
      return "已采集";
    case "ai_recognized":
      return "Mock AI 已处理";
    case "approval_pending":
      return "待审批";
    case "manual_correction_required":
      return "待补正";
    case "human_review_required":
      return "待复核";
    case "risk_review_required":
      return "风险复核";
    case "approved":
      return "已批准";
    case "rejected":
      return "已驳回";
    case "escalated":
      return "已升级";
    case "archived":
      return "已归档";
  }
}

function normalizeGovernanceFields(
  sourceType: GovernanceSourceType,
  scenarioId: GovernanceMockScenarioId,
  manualFields?: Partial<GovernanceNormalizedFields>,
): GovernanceNormalizedFields {
  const scenarioFields = governanceMockScenarios[scenarioId].aiEvidence
    .extractedFields;
  const normalized = {
    ...baseFields,
    ...scenarioFields,
    ...manualFields,
  };

  return {
    assessedValueTenThousand: normalized.assessedValueTenThousand,
    businessType:
      normalized.businessType?.trim() ||
      `${getSourceTypeLabel(sourceType)}业务治理`,
    contactPhone: normalized.contactPhone?.trim() || undefined,
    coordinates: normalized.coordinates ?? null,
    entityName: normalized.entityName?.trim() || "未命名治理主体",
    enterpriseComplianceStatus: normalized.enterpriseComplianceStatus,
    enterpriseGovernanceRating: normalized.enterpriseGovernanceRating?.trim(),
    enterpriseGovernanceScore: normalized.enterpriseGovernanceScore,
    enterpriseRegistrationNumber:
      normalized.enterpriseRegistrationNumber?.trim(),
    enterpriseRemediationFocus: normalized.enterpriseRemediationFocus,
    leaseExpiryDate: normalized.leaseExpiryDate?.trim(),
    locationLabel: normalized.locationLabel?.trim(),
    ownerName: normalized.ownerName?.trim() || "待补充",
    ownershipStatus: normalized.ownershipStatus?.trim(),
    propertyAddress: normalized.propertyAddress?.trim() || "待补充",
    propertyAreaSqm: normalized.propertyAreaSqm,
    propertyNumber: normalized.propertyNumber?.trim(),
    propertyType: normalized.propertyType?.trim(),
    registrationNo: normalized.registrationNo?.trim() || "待补充",
    rentOverdueAmountTenThousand: normalized.rentOverdueAmountTenThousand,
    riskNote: normalized.riskNote?.trim() || undefined,
    tenantName: normalized.tenantName?.trim(),
  };
}

function buildTitle(fields: GovernanceNormalizedFields) {
  return `${fields.entityName} / ${fields.businessType}`;
}

function hasMissingValue(value: string | undefined) {
  return !value?.trim() || value === "待补充";
}

function validateRecordFields(fields: GovernanceNormalizedFields) {
  const fieldErrors: Record<string, string> = {};

  if (hasMissingValue(fields.entityName)) {
    fieldErrors.entityName = "请输入主体名称。";
  }

  if (hasMissingValue(fields.businessType)) {
    fieldErrors.businessType = "请输入业务类型。";
  }

  if (hasMissingValue(fields.propertyAddress)) {
    fieldErrors.propertyAddress = "请输入不动产地址或治理对象地址。";
  }

  if (fields.contactPhone && !/^1\d{10}$/.test(fields.contactPhone)) {
    fieldErrors.contactPhone = "联系电话需为 11 位手机号。";
  }

  if (Object.keys(fieldErrors).length) {
    throw new AdminValidationError("治理记录字段校验未通过。", fieldErrors);
  }
}

type GovernanceRecordRow = typeof governanceRecordsTable.$inferSelect;
type GovernanceWorkflowInstanceRow =
  typeof governanceWorkflowInstancesTable.$inferSelect;

function getPersistedNormalizedFields(record: GovernanceRecordRow) {
  const scenarioId = isGovernanceMockScenarioId(record.mockScenarioId)
    ? record.mockScenarioId
    : "normal-success";

  return normalizeGovernanceFields(
    record.sourceType,
    scenarioId,
    record.normalizedFields as Partial<GovernanceNormalizedFields>,
  );
}

function getLeaseExpiryStatus(
  leaseExpiryDate?: string | null,
): GovernanceLeaseExpiryStatus {
  if (!leaseExpiryDate) {
    return "not_applicable";
  }

  const expiryTime = new Date(leaseExpiryDate).getTime();

  if (Number.isNaN(expiryTime)) {
    return "not_applicable";
  }

  const today = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiryTime - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (daysUntilExpiry < 0) {
    return "expired";
  }

  if (daysUntilExpiry <= 90) {
    return "expiring_soon";
  }

  return "active";
}

function getRiskLevel(input: {
  fields: GovernanceNormalizedFields;
  record: GovernanceRecordRow;
  warnings: Array<typeof governanceRiskWarningsTable.$inferSelect>;
}): GovernanceAssetRiskLevel {
  if (input.fields.riskNote?.trim()) {
    return "high";
  }

  if (input.warnings.some((warning) => warning.severity === "critical")) {
    return "critical";
  }

  if (input.warnings.some((warning) => warning.severity === "warning")) {
    return "high";
  }

  if (
    input.record.status === "risk_review_required" ||
    input.record.status === "escalated" ||
    input.record.status === "manual_correction_required"
  ) {
    return "medium";
  }

  return "low";
}

function getValueAssessment(input: {
  assessedValueTenThousand: number;
  areaSqm: number;
  riskLevel: GovernanceAssetRiskLevel;
}) {
  const valuePerSqm =
    input.areaSqm > 0
      ? Math.round((input.assessedValueTenThousand * 10_000) / input.areaSqm)
      : 0;
  const label =
    input.riskLevel === "critical" || input.riskLevel === "high"
      ? "规则估值需复核"
      : valuePerSqm > 70_000
        ? "规则估值偏高"
        : "规则估值正常";

  return {
    label,
    source: "rule-based" as const,
    sourceFields: ["评估值", "建筑面积", "风险级别"],
  };
}

function toAssetLedgerItem(input: {
  activeWarningCount: number;
  pendingReminder?: string | null;
  record: GovernanceRecordRow;
  uploadCount: number;
  warnings: Array<typeof governanceRiskWarningsTable.$inferSelect>;
}): GovernanceAssetLedgerItem {
  const fields = getPersistedNormalizedFields(input.record);
  const leaseExpiryDate = fields.leaseExpiryDate ?? null;
  const leaseExpiryStatus = getLeaseExpiryStatus(leaseExpiryDate);
  const riskLevel = getRiskLevel({
    fields,
    record: input.record,
    warnings: input.warnings,
  });
  const propertyAreaSqm = fields.propertyAreaSqm ?? 0;
  const assessedValueTenThousand = fields.assessedValueTenThousand ?? 0;
  const rentOverdueAmountTenThousand = fields.rentOverdueAmountTenThousand ?? 0;

  return {
    ...toRecordSummary({
      ...input.record,
      activeWarningCount: input.activeWarningCount,
      pendingReminder: input.pendingReminder ?? null,
      uploadCount: input.uploadCount,
    }),
    assessedValueTenThousand,
    coordinateStatus: fields.coordinates ? "coordinates" : "address_only",
    coordinates: fields.coordinates ?? null,
    leaseExpiryDate,
    leaseExpiryStatus,
    locationLabel: fields.locationLabel ?? fields.propertyAddress,
    ownershipRiskIndicator: {
      label:
        fields.ownershipStatus === "共有" || riskLevel === "critical"
          ? "权属需复核"
          : "权属规则正常",
      source: "rule-based",
    },
    ownershipStatus: fields.ownershipStatus ?? "待补充",
    propertyAreaSqm,
    propertyNumber: fields.propertyNumber ?? fields.registrationNo,
    propertyType: fields.propertyType ?? "综合",
    rentOverdueIndicator: {
      amountTenThousand: rentOverdueAmountTenThousand,
      label:
        rentOverdueAmountTenThousand > 0
          ? "模拟应收逾期"
          : "模拟应收正常",
      source: "mock-derived",
    },
    riskLevel,
    tenantName: fields.tenantName ?? "自用",
    valueAssessment: getValueAssessment({
      areaSqm: propertyAreaSqm,
      assessedValueTenThousand,
      riskLevel,
    }),
    workflowStatus: input.record.status,
  };
}

function incrementCount<T extends string>(
  bucket: Record<T, number>,
  key: T,
  amount = 1,
) {
  bucket[key] = (bucket[key] ?? 0) + amount;
}

function buildMapDistribution(
  assets: GovernanceAssetLedgerItem[],
): GovernanceMapDistributionGroup[] {
  const groupByLocation = new Map<string, GovernanceMapDistributionGroup>();

  for (const asset of assets) {
    const group =
      groupByLocation.get(asset.locationLabel) ??
      ({
        addressOnlyCount: 0,
        coordinateCount: 0,
        locationLabel: asset.locationLabel,
        ownershipStatusCounts: {},
        recordCount: 0,
        riskCounts: {
          critical: 0,
          high: 0,
          low: 0,
          medium: 0,
        },
      } satisfies GovernanceMapDistributionGroup);

    group.recordCount += 1;
    if (asset.coordinateStatus === "coordinates") {
      group.coordinateCount += 1;
    } else {
      group.addressOnlyCount += 1;
    }
    incrementCount(group.riskCounts, asset.riskLevel);
    group.ownershipStatusCounts[asset.ownershipStatus] =
      (group.ownershipStatusCounts[asset.ownershipStatus] ?? 0) + 1;
    groupByLocation.set(asset.locationLabel, group);
  }

  return Array.from(groupByLocation.values()).sort(
    (left, right) => right.recordCount - left.recordCount,
  );
}

function buildAssetFilterOptions(
  assets: GovernanceAssetLedgerItem[],
): GovernanceAssetLedgerFilters {
  return {
    leaseExpiryStatuses: Array.from(
      new Set(assets.map((asset) => asset.leaseExpiryStatus)),
    ),
    ownershipStatuses: Array.from(
      new Set(assets.map((asset) => asset.ownershipStatus)),
    ),
    propertyTypes: Array.from(new Set(assets.map((asset) => asset.propertyType))),
    riskLevels: Array.from(new Set(assets.map((asset) => asset.riskLevel))),
    tenants: Array.from(new Set(assets.map((asset) => asset.tenantName))),
    workflowStatuses: Array.from(
      new Set(assets.map((asset) => asset.workflowStatus)),
    ),
  };
}

function hasRequiredFieldGap(fields: GovernanceNormalizedFields) {
  return (
    hasMissingValue(fields.registrationNo) ||
    hasMissingValue(fields.ownerName) ||
    hasMissingValue(fields.propertyAddress)
  );
}

function deriveComplianceStatus(input: {
  fields: GovernanceNormalizedFields;
  findings: Array<typeof governanceFindingsTable.$inferSelect>;
  record: GovernanceRecordRow;
  warnings: Array<typeof governanceRiskWarningsTable.$inferSelect>;
}): GovernanceEnterpriseComplianceStatus {
  if (input.fields.enterpriseComplianceStatus) {
    return input.fields.enterpriseComplianceStatus;
  }

  if (
    input.warnings.some((warning) => warning.severity === "critical") ||
    input.findings.some((finding) => finding.isBlocking)
  ) {
    return "blocked";
  }

  if (hasRequiredFieldGap(input.fields)) {
    return "remediation";
  }

  if (input.warnings.length > 0 || input.record.status === "risk_review_required") {
    return "attention";
  }

  return "normal";
}

function getGovernanceRating(score: number) {
  if (score >= 90) {
    return "A";
  }

  if (score >= 75) {
    return "B";
  }

  if (score >= 60) {
    return "C";
  }

  return "D";
}

function toEnterpriseLedgerItem(input: {
  aiJobs: Array<typeof governanceAiJobsTable.$inferSelect>;
  findings: Array<typeof governanceFindingsTable.$inferSelect>;
  latestWorkflow?: GovernanceWorkflowInstanceRow;
  pendingReminder?: string | null;
  record: GovernanceRecordRow;
  uploadCount: number;
  warnings: Array<typeof governanceRiskWarningsTable.$inferSelect>;
}): GovernanceEnterpriseLedgerItem {
  const fields = getPersistedNormalizedFields(input.record);
  const complianceStatus = deriveComplianceStatus({
    fields,
    findings: input.findings,
    record: input.record,
    warnings: input.warnings,
  });
  const missingPenalty = hasRequiredFieldGap(fields) ? 15 : 0;
  const score =
    fields.enterpriseGovernanceScore ??
    Math.max(45, 92 - input.warnings.length * 10 - missingPenalty);
  const remediationFocus = Array.from(
    new Set([
      ...(fields.enterpriseRemediationFocus ?? []),
      ...input.warnings.map((warning) => warning.remediationHint),
      ...input.findings
        .filter((finding) => finding.status === "open")
        .map((finding) => finding.summary),
    ]),
  ).filter(Boolean);

  return {
    ...toRecordSummary({
      ...input.record,
      activeWarningCount: input.warnings.length,
      pendingReminder: input.pendingReminder ?? null,
      uploadCount: input.uploadCount,
    }),
    approvalState: input.record.finalOutcomeStatus ?? "流转中",
    completenessStatus: hasRequiredFieldGap(fields)
      ? "missing_required_fields"
      : "complete",
    complianceStatus,
    duplicateFindingCount: input.warnings.filter((warning) =>
      warning.source.includes("duplication"),
    ).length,
    governanceRating:
      fields.enterpriseGovernanceRating ?? getGovernanceRating(score),
    governanceScore: score,
    mockAiIndicatorCount: input.aiJobs.reduce(
      (total, job) => total + job.riskIndicators.length,
      0,
    ),
    openWarningCount: input.warnings.length,
    registrationNumber:
      fields.enterpriseRegistrationNumber ?? fields.registrationNo,
    remediationFocus,
    responsibleParty: fields.ownerName,
    workflowState:
      input.latestWorkflow?.currentNodeName ??
      input.record.finalOutcomeStatus ??
      getGovernanceStatusLabel(input.record.status),
  };
}

function getTodoPriority(severity: GovernanceRiskSeverity): GovernanceTodoItem["priority"] {
  if (severity === "critical") {
    return "critical";
  }

  if (severity === "warning") {
    return "high";
  }

  return "normal";
}

async function appendWorkflowEvent(input: {
  actor?: AdminSessionUser;
  action: string;
  metadata?: Record<string, unknown> | null;
  reason?: string | null;
  recordId: string;
  result: string;
  step: string;
  summary: string;
}) {
  await db.insert(governanceWorkflowEventsTable).values({
    action: input.action,
    actorDisplayName: input.actor?.displayName ?? "系统自动处理",
    actorType: input.actor ? "admin" : "system",
    actorUserId: input.actor?.id ?? null,
    createdAt: new Date(),
    id: randomUUID(),
    metadata: input.metadata ?? null,
    reason: input.reason ?? null,
    recordId: input.recordId,
    result: input.result,
    step: input.step,
    summary: input.summary,
  });
}

async function createReminder(recordId: string, type: string, summary: string) {
  await db.insert(governanceRemindersTable).values({
    createdAt: new Date(),
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    id: randomUUID(),
    recordId,
    resolvedAt: null,
    status: "pending",
    summary,
    type,
  });
}

async function resolvePendingReminders(recordId: string, type?: string) {
  const where = type
    ? and(
        eq(governanceRemindersTable.recordId, recordId),
        eq(governanceRemindersTable.status, "pending"),
        eq(governanceRemindersTable.type, type),
      )
    : and(
        eq(governanceRemindersTable.recordId, recordId),
        eq(governanceRemindersTable.status, "pending"),
      );

  await db
    .update(governanceRemindersTable)
    .set({
      resolvedAt: new Date(),
      status: "resolved",
    })
    .where(where);
}

async function findDuplicateRecords(
  fields: GovernanceNormalizedFields,
  currentRecordId?: string,
) {
  const records = await db.select().from(governanceRecordsTable).all();

  return records.filter((record) => {
    if (currentRecordId && record.id === currentRecordId) {
      return false;
    }

    const normalized = record.normalizedFields as GovernanceNormalizedFields;
    const exactIdentity = identityFields.every(
      (field) =>
        normalized[field] &&
        fields[field] &&
        normalized[field].trim() === fields[field].trim(),
    );
    const samePropertyOwner =
      normalized.propertyAddress === fields.propertyAddress &&
      normalized.ownerName === fields.ownerName;

    return exactIdentity || samePropertyOwner;
  });
}

export async function getDuplicateDetectionHints(
  fields: Partial<GovernanceNormalizedFields>,
  currentRecordId?: string,
) {
  await ensureGovernanceData();

  const normalized = normalizeGovernanceFields(
    "manual",
    "normal-success",
    fields,
  );
  const duplicates = await findDuplicateRecords(normalized, currentRecordId);

  return duplicates.map((record) => ({
    id: record.id,
    title: record.title,
    reason: "主体名称、登记编号或地址权属人组合与既有记录匹配。",
  }));
}

async function insertScenarioFindings(
  recordId: string,
  scenarioId: GovernanceMockScenarioId,
) {
  const scenario = governanceMockScenarios[scenarioId];

  for (const finding of scenario.validationFindings) {
    await db.insert(governanceFindingsTable).values({
      createdAt: new Date(),
      details: finding.details,
      id: randomUUID(),
      isBlocking: finding.isBlocking,
      kind: finding.kind,
      recordId,
      severity: finding.severity,
      status: "open",
      summary: finding.summary,
    });
  }
}

async function createRiskWarning(input: {
  reason: string;
  recordId: string;
  relatedJobId?: string | null;
  remediationHint: string;
  scenarioRunId?: string | null;
  severity: GovernanceRiskSeverity;
  source: string;
}) {
  const existing = await db
    .select()
    .from(governanceRiskWarningsTable)
    .where(eq(governanceRiskWarningsTable.recordId, input.recordId))
    .all();

  if (
    existing.some(
      (warning) =>
        warning.reason === input.reason &&
        warning.source === input.source &&
        warning.status === "open",
    )
  ) {
    return;
  }

  const now = new Date();

  await db.insert(governanceRiskWarningsTable).values({
    createdAt: now,
    id: randomUUID(),
    reason: input.reason,
    recordId: input.recordId,
    relatedJobId: input.relatedJobId ?? null,
    remediationHint: input.remediationHint,
    scenarioRunId: input.scenarioRunId ?? null,
    severity: input.severity,
    source: input.source,
    status: "open",
    updatedAt: now,
  });
}

async function runGovernanceChecks(recordId: string) {
  const record = await db
    .select()
    .from(governanceRecordsTable)
    .where(eq(governanceRecordsTable.id, recordId))
    .get();

  if (!record) {
    throw new AdminServiceError("未找到指定治理记录。", 404);
  }

  const fields = getPersistedNormalizedFields(record);

  if (
    hasMissingValue(fields.registrationNo) ||
    hasMissingValue(fields.ownerName) ||
    hasMissingValue(fields.propertyAddress)
  ) {
    await createRiskWarning({
      reason: "业务记录缺少登记编号、权属人或地址等治理必填信息。",
      recordId,
      remediationHint: "补齐缺失字段后重新提交审批或重新运行 Mock AI 识别。",
      severity: "warning",
      source: "rule:completeness",
    });
  }

  if (fields.ownerName.includes("/")) {
    await createRiskWarning({
      reason: "权属人字段存在多源冲突标记。",
      recordId,
      remediationHint: "核对原始材料、Excel 附表与人工补正字段，保留确认后的唯一权属人。",
      severity: "critical",
      source: "rule:consistency",
    });
  }

  const duplicates = await findDuplicateRecords(fields, recordId);

  if (duplicates.length > 0) {
    await createRiskWarning({
      reason: `发现 ${duplicates.length} 条潜在重复治理记录。`,
      recordId,
      remediationHint: "打开重复记录比对主体、登记编号和地址，确认后合并或驳回重复提交。",
      severity: "warning",
      source: "rule:duplication",
    });
  }

  const staleThreshold = Date.now() - 30 * 24 * 60 * 60 * 1000;

  if (new Date(record.updatedAt).getTime() < staleThreshold) {
    await createRiskWarning({
      reason: "记录超过 30 天未更新，可能存在信息过期。",
      recordId,
      remediationHint: "联系业务责任人复核最新材料后更新记录。",
      severity: "info",
      source: "rule:stale_information",
    });
  }

  if (fields.riskNote?.trim()) {
    await createRiskWarning({
      reason: fields.riskNote,
      recordId,
      remediationHint: "由风险复核节点确认风险是否关闭，必要时升级处理。",
      severity: "warning",
      source: "rule:risk_note",
    });
  }
}

async function seedTemplates() {
  const now = new Date();

  for (const template of governanceTemplateRegistry) {
    await db
      .insert(governanceTemplatesTable)
      .values({
        allowedExtensions: template.allowedExtensions,
        auditEnabled: template.auditEnabled,
        category: template.category,
        content: buildTemplateContent(template),
        description: template.description,
        filename: template.filename,
        key: template.key,
        label: template.label,
        maxSizeMb: template.maxSizeMb,
        requiredFields: template.requiredFields,
        scenarioKey: template.scenarioKey,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: governanceTemplatesTable.key,
        set: {
          allowedExtensions: template.allowedExtensions,
          auditEnabled: template.auditEnabled,
          category: template.category,
          content: buildTemplateContent(template),
          description: template.description,
          filename: template.filename,
          label: template.label,
          maxSizeMb: template.maxSizeMb,
          requiredFields: template.requiredFields,
          scenarioKey: template.scenarioKey,
          updatedAt: now,
        },
      });
  }
}

async function createRecordInternal(input: {
  allowDuplicate?: boolean;
  fields?: Partial<GovernanceNormalizedFields>;
  mockScenarioId?: string;
  originalFilename?: string;
  scenarioRunId?: string | null;
  sessionUser?: AdminSessionUser;
  sourceType: GovernanceSourceType;
}) {
  if (!isGovernanceSourceType(input.sourceType)) {
    throw new AdminServiceError("不支持的治理导入类型。");
  }

  if (input.sourceType !== "manual" && !input.originalFilename?.trim()) {
    throw new AdminServiceError("请输入导入文件名，用于记录资料来源。");
  }

  const resolvedScenario = resolveGovernanceMockScenario({
    filename: input.originalFilename,
    marker: input.mockScenarioId,
    sourceType: input.sourceType,
  });
  const scenarioId = resolvedScenario.scenarioId;
  const normalizedFields = normalizeGovernanceFields(
    input.sourceType,
    scenarioId,
    input.fields,
  );

  validateRecordFields(normalizedFields);

  const duplicates = await findDuplicateRecords(normalizedFields);

  if (!input.allowDuplicate && duplicates.length > 0) {
    throw new AdminServiceError(
      `发现潜在重复记录：${duplicates[0].title}。默认不创建重复业务数据。`,
      409,
    );
  }

  const now = new Date();
  const batchId = input.sourceType === "manual" ? null : randomUUID();
  const recordId = randomUUID();

  if (batchId) {
    await db.insert(governanceImportBatchesTable).values({
      createdAt: now,
      createdByUserId: input.sessionUser?.id ?? null,
      id: batchId,
      mockScenarioId: scenarioId,
      mockScenarioSource: resolvedScenario.scenarioSource,
      originalFilename: input.originalFilename?.trim() ?? null,
      sourceType: input.sourceType,
    });
  }

  await db.insert(governanceRecordsTable).values({
    aiEvidence: null,
    batchId,
    businessType: normalizedFields.businessType,
    createdAt: now,
    entityName: normalizedFields.entityName,
    finalOutcomeReason: null,
    finalOutcomeSource: null,
    finalOutcomeStatus: null,
    id: recordId,
    mockScenarioId: scenarioId,
    mockScenarioSource: resolvedScenario.scenarioSource,
    normalizedFields,
    originalFilename: input.originalFilename?.trim() || null,
    ownerName: normalizedFields.ownerName,
    propertyAddress: normalizedFields.propertyAddress,
    sourceType: input.sourceType,
    status: "intake_completed",
    title: buildTitle(normalizedFields),
    updatedAt: now,
  });

  await appendWorkflowEvent({
    actor: input.sessionUser,
    action: "创建业务记录",
    metadata: {
      batchId,
      scenarioId,
      scenarioRunId: input.scenarioRunId ?? null,
      scenarioSource: resolvedScenario.scenarioSource,
      sourceType: input.sourceType,
    },
    recordId,
    result: "completed",
    step: "intake",
    summary: `${getSourceTypeLabel(input.sourceType)}已归集为统一业务治理记录。`,
  });

  await createReminder(recordId, "upload", "请上传 DOCX、图片或 Excel 资料并完成校验。");
  await insertScenarioFindings(recordId, scenarioId);
  await runGovernanceChecks(recordId);

  return recordId;
}

async function seedFixtureRecords() {
  const existingRecords = await db.select().from(governanceRecordsTable).all();

  if (existingRecords.length > 0) {
    return;
  }

  const seedActor: AdminSessionUser = {
    displayName: "系统示例数据",
    id: "root-account",
    roleKey: "root",
    username: "root",
  };

  const firstRecordId = await createRecordInternal({
    allowDuplicate: true,
    fields: {
      ...baseFields,
      assessedValueTenThousand: 12800,
      coordinates: {
        lat: 31.2397,
        lng: 121.4998,
      },
      entityName: "青岚置业有限公司",
      enterpriseComplianceStatus: "normal",
      enterpriseGovernanceRating: "A",
      enterpriseGovernanceScore: 92,
      enterpriseRegistrationNumber: "91310000MA1K00001A",
      enterpriseRemediationFocus: ["保持年度权属材料更新"],
      leaseExpiryDate: "2026-08-31",
      locationLabel: "上海浦东",
      ownershipStatus: "自持",
      propertyAreaSqm: 1860,
      propertyNumber: "RE-2026-001",
      propertyType: "办公",
      registrationNo: "GOV-2026-SEED-01",
      rentOverdueAmountTenThousand: 0,
      tenantName: "青岚城市服务",
    },
    mockScenarioId: "normal-success",
    originalFilename: "normal-success.docx",
    sessionUser: seedActor,
    sourceType: "docx",
  });
  const secondRecordId = await createRecordInternal({
    allowDuplicate: true,
    fields: {
      ...baseFields,
      assessedValueTenThousand: 24600,
      businessType: "企业治理合规复核",
      coordinates: null,
      entityName: "澄湖城市运营集团",
      enterpriseComplianceStatus: "remediation",
      enterpriseGovernanceRating: "C",
      enterpriseGovernanceScore: 68,
      enterpriseRegistrationNumber: "91320594MA1K00002B",
      enterpriseRemediationFocus: ["核验历史抵押事项", "确认权属人冲突字段"],
      leaseExpiryDate: "2026-06-20",
      locationLabel: "苏州园区",
      ownerName: "韩骁 / 周序",
      ownershipStatus: "共有",
      propertyAddress: "苏州市工业园区星湖街 328 号",
      propertyAreaSqm: 3200,
      propertyNumber: "RE-2026-002",
      propertyType: "产业园",
      registrationNo: "GOV-2026-SEED-02",
      rentOverdueAmountTenThousand: 36,
      riskNote: "历史抵押事项待核验",
      tenantName: "澄湖科创孵化器",
    },
    mockScenarioId: "risk-warning",
    originalFilename: "risk-warning.xlsx",
    sessionUser: seedActor,
    sourceType: "excel",
  });

  await createUploadInternal(firstRecordId, {
    category: "docx",
    fileName: "normal-success.docx",
    fileSize: 460_000,
    templateKey: "real-estate-docx-intake",
  }, seedActor, { allowRejectedPersistence: false });
  await createUploadInternal(secondRecordId, {
    category: "excel",
    fileName: "risk-warning.xlsx",
    fileSize: 780_000,
    templateKey: "enterprise-excel-register",
  }, seedActor, { allowRejectedPersistence: false });
  await submitWorkflowInternal(firstRecordId, seedActor);
  await submitWorkflowInternal(secondRecordId, seedActor);
  await createAiJobInternal(secondRecordId, {
    inputReference: secondRecordId,
    processorName: "risk-scan",
  }, seedActor, { forceComplete: true });
}

async function ensureGovernanceData() {
  await ensureAdminDatabase();

  if (!governanceSeedPromise) {
    governanceSeedPromise = seedTemplates()
      .then(seedFixtureRecords)
      .catch((error) => {
        governanceSeedPromise = null;
        throw error;
      });
  }

  await governanceSeedPromise;
}

function toRecordSummary(
  record: typeof governanceRecordsTable.$inferSelect & {
    activeWarningCount?: number;
    pendingReminder?: string | null;
    uploadCount?: number;
  },
): GovernanceRecordSummary {
  return {
    activeWarningCount: record.activeWarningCount ?? 0,
    batchId: record.batchId,
    businessType: record.businessType,
    createdAt: formatAdminDate(record.createdAt) ?? "",
    entityName: record.entityName,
    finalOutcomeReason: record.finalOutcomeReason,
    finalOutcomeSource: record.finalOutcomeSource,
    finalOutcomeStatus: record.finalOutcomeStatus,
    id: record.id,
    mockScenarioId: record.mockScenarioId,
    mockScenarioSource: record.mockScenarioSource,
    originalFilename: record.originalFilename,
    ownerName: record.ownerName,
    pendingReminder: record.pendingReminder ?? null,
    propertyAddress: record.propertyAddress,
    sourceType: record.sourceType,
    status: record.status,
    title: record.title,
    updatedAt: formatAdminDate(record.updatedAt) ?? "",
    uploadCount: record.uploadCount ?? 0,
  };
}

function toFinding(record: typeof governanceFindingsTable.$inferSelect) {
  return {
    createdAt: formatAdminDate(record.createdAt) ?? "",
    details: record.details,
    id: record.id,
    isBlocking: record.isBlocking,
    kind: record.kind,
    severity: record.severity,
    status: record.status,
    summary: record.summary,
  };
}

function toUpload(record: typeof governanceUploadsTable.$inferSelect) {
  return {
    category: record.category,
    createdAt: formatAdminDate(record.createdAt) ?? "",
    fileName: record.fileName,
    fileSize: record.fileSize,
    fileType: record.fileType,
    id: record.id,
    templateKey: record.templateKey,
    uploaderName: record.uploaderName,
    validationMessages: record.validationMessages,
    validationStatus: record.validationStatus,
  };
}

function toWorkflowInstance(
  record: typeof governanceWorkflowInstancesTable.$inferSelect,
) {
  return {
    assigneeRole: record.assigneeRole,
    assigneeUserId: record.assigneeUserId,
    completedAt: formatAdminDate(record.completedAt),
    currentNodeKey: record.currentNodeKey,
    currentNodeName: record.currentNodeName,
    id: record.id,
    status: record.status,
    submittedAt: formatAdminDate(record.submittedAt) ?? "",
    updatedAt: formatAdminDate(record.updatedAt) ?? "",
  };
}

function toReminder(record: typeof governanceRemindersTable.$inferSelect) {
  return {
    createdAt: formatAdminDate(record.createdAt) ?? "",
    id: record.id,
    resolvedAt: formatAdminDate(record.resolvedAt),
    status: record.status,
    summary: record.summary,
    type: record.type,
  };
}

function toWorkflowEvent(record: typeof governanceWorkflowEventsTable.$inferSelect) {
  return {
    action: record.action,
    actorDisplayName: record.actorDisplayName,
    actorType: record.actorType,
    createdAt: formatAdminDate(record.createdAt) ?? "",
    id: record.id,
    reason: record.reason,
    result: record.result,
    step: record.step,
    summary: record.summary,
  };
}

function toAiJob(record: typeof governanceAiJobsTable.$inferSelect) {
  return {
    completedAt: formatAdminDate(record.completedAt),
    completesAt: formatAdminDate(record.completesAt) ?? "",
    createdAt: formatAdminDate(record.createdAt) ?? "",
    delayMs: record.delayMs,
    id: record.id,
    inputReference: record.inputReference,
    mockSource: record.mockSource,
    outputPayload: record.outputPayload,
    outputSummary: record.outputSummary,
    processorName: record.processorName,
    riskIndicators: record.riskIndicators,
    status: record.status,
  };
}

function toRiskWarning(record: typeof governanceRiskWarningsTable.$inferSelect) {
  return {
    createdAt: formatAdminDate(record.createdAt) ?? "",
    id: record.id,
    reason: record.reason,
    recordId: record.recordId,
    relatedJobId: record.relatedJobId,
    remediationHint: record.remediationHint,
    severity: record.severity,
    source: record.source,
    status: record.status,
    updatedAt: formatAdminDate(record.updatedAt) ?? "",
  };
}

function toTemplate(record: typeof governanceTemplatesTable.$inferSelect) {
  return {
    allowedExtensions: record.allowedExtensions,
    auditEnabled: record.auditEnabled,
    category: record.category,
    description: record.description,
    filename: record.filename,
    key: record.key,
    label: record.label,
    maxSizeMb: record.maxSizeMb,
    requiredFields: record.requiredFields,
    scenarioKey: record.scenarioKey,
  };
}

function toScenarioRun(record: typeof governanceScenarioRunsTable.$inferSelect) {
  return {
    bundleKey: record.bundleKey,
    completedAt: formatAdminDate(record.completedAt),
    createdAt: formatAdminDate(record.createdAt) ?? "",
    currentStep: record.currentStep,
    id: record.id,
    label: record.label,
    status: record.status,
    totalSteps: record.totalSteps,
    updatedAt: formatAdminDate(record.updatedAt) ?? "",
  };
}

async function completeDueAiJobs(recordId?: string) {
  const jobs = await db
    .select()
    .from(governanceAiJobsTable)
    .where(eq(governanceAiJobsTable.status, "processing"))
    .all();
  const now = new Date();

  for (const job of jobs) {
    if (recordId && job.recordId !== recordId) {
      continue;
    }

    if (new Date(job.completesAt).getTime() > now.getTime()) {
      continue;
    }

    const processor = getProcessor(job.processorName);
    const outputSummary = processor?.outputSummary ?? "Mock AI 处理已完成。";

    await db
      .update(governanceAiJobsTable)
      .set({
        completedAt: now,
        outputPayload: {
          boundary: "mock",
          completedBy: "deterministic-fixture",
          indicators: job.riskIndicators,
          processorName: job.processorName,
        },
        outputSummary,
        status: "completed",
      })
      .where(eq(governanceAiJobsTable.id, job.id));

    await db
      .update(governanceRecordsTable)
      .set({
        aiEvidence: {
          mockSource: "configured-processor",
          processorName: job.processorName,
          result: outputSummary,
        },
        status: "ai_recognized",
        updatedAt: now,
      })
      .where(eq(governanceRecordsTable.id, job.recordId));

    for (const indicator of job.riskIndicators) {
      await createRiskWarning({
        reason: `Mock AI 指标命中：${indicator}`,
        recordId: job.recordId,
        relatedJobId: job.id,
        remediationHint: "该结果来自 Mock AI，请结合真实业务材料人工复核后处置。",
        scenarioRunId: job.scenarioRunId,
        severity: indicator.includes("conflict") ? "critical" : "warning",
        source: `mock-ai:${job.processorName}`,
      });
    }

    await appendWorkflowEvent({
      action: "完成 Mock AI 处理",
      metadata: {
        boundary: "mock",
        jobId: job.id,
        processorName: job.processorName,
        riskIndicators: job.riskIndicators,
      },
      recordId: job.recordId,
      result: "completed",
      step: "ai_mock_processing",
      summary: `${outputSummary} 所有结果均为可替换 Mock 输出。`,
    });

    await runGovernanceChecks(job.recordId);
  }
}

export async function listGovernanceRecords() {
  await ensureGovernanceData();
  await completeDueAiJobs();

  const [records, reminders, uploads, warnings] = await Promise.all([
    db
      .select()
      .from(governanceRecordsTable)
      .orderBy(desc(governanceRecordsTable.updatedAt))
      .all(),
    db
      .select()
      .from(governanceRemindersTable)
      .where(eq(governanceRemindersTable.status, "pending"))
      .all(),
    db.select().from(governanceUploadsTable).all(),
    db
      .select()
      .from(governanceRiskWarningsTable)
      .where(eq(governanceRiskWarningsTable.status, "open"))
      .all(),
  ]);

  const reminderByRecordId = new Map(
    reminders.map((reminder) => [reminder.recordId, reminder.summary]),
  );

  return records.map((record) =>
    toRecordSummary({
      ...record,
      activeWarningCount: warnings.filter(
        (warning) => warning.recordId === record.id,
      ).length,
      pendingReminder: reminderByRecordId.get(record.id) ?? null,
      uploadCount: uploads.filter((upload) => upload.recordId === record.id)
        .length,
    }),
  );
}

export async function getRealEstateAssetLedger(): Promise<GovernanceAssetLedgerResponse> {
  await ensureGovernanceData();
  await completeDueAiJobs();

  const [records, reminders, uploads, warnings] = await Promise.all([
    db
      .select()
      .from(governanceRecordsTable)
      .orderBy(desc(governanceRecordsTable.updatedAt))
      .all(),
    db
      .select()
      .from(governanceRemindersTable)
      .where(eq(governanceRemindersTable.status, "pending"))
      .all(),
    db.select().from(governanceUploadsTable).all(),
    db
      .select()
      .from(governanceRiskWarningsTable)
      .where(eq(governanceRiskWarningsTable.status, "open"))
      .all(),
  ]);
  const reminderByRecordId = new Map(
    reminders.map((reminder) => [reminder.recordId, reminder.summary]),
  );
  const assets = records.map((record) => {
    const recordWarnings = warnings.filter(
      (warning) => warning.recordId === record.id,
    );

    return toAssetLedgerItem({
      activeWarningCount: recordWarnings.length,
      pendingReminder: reminderByRecordId.get(record.id) ?? null,
      record,
      uploadCount: uploads.filter((upload) => upload.recordId === record.id)
        .length,
      warnings: recordWarnings,
    });
  });

  return {
    assets,
    filters: buildAssetFilterOptions(assets),
    mapDistribution: buildMapDistribution(assets),
  };
}

export async function getEnterpriseGovernanceAnalysis(): Promise<GovernanceEnterpriseAnalysisResponse> {
  await ensureGovernanceData();
  await completeDueAiJobs();

  const [records, reminders, uploads, warnings, findings, workflows, aiJobs] =
    await Promise.all([
      db
        .select()
        .from(governanceRecordsTable)
        .orderBy(desc(governanceRecordsTable.updatedAt))
        .all(),
      db
        .select()
        .from(governanceRemindersTable)
        .where(eq(governanceRemindersTable.status, "pending"))
        .all(),
      db.select().from(governanceUploadsTable).all(),
      db
        .select()
        .from(governanceRiskWarningsTable)
        .where(eq(governanceRiskWarningsTable.status, "open"))
        .all(),
      db
        .select()
        .from(governanceFindingsTable)
        .where(eq(governanceFindingsTable.status, "open"))
        .all(),
      db
        .select()
        .from(governanceWorkflowInstancesTable)
        .orderBy(desc(governanceWorkflowInstancesTable.updatedAt))
        .all(),
      db.select().from(governanceAiJobsTable).all(),
    ]);
  const reminderByRecordId = new Map(
    reminders.map((reminder) => [reminder.recordId, reminder.summary]),
  );
  const latestWorkflowByRecordId = new Map<string, GovernanceWorkflowInstanceRow>();

  for (const workflow of workflows) {
    if (!latestWorkflowByRecordId.has(workflow.recordId)) {
      latestWorkflowByRecordId.set(workflow.recordId, workflow);
    }
  }

  const enterprises = records.map((record) =>
    toEnterpriseLedgerItem({
      aiJobs: aiJobs.filter((job) => job.recordId === record.id),
      findings: findings.filter((finding) => finding.recordId === record.id),
      latestWorkflow: latestWorkflowByRecordId.get(record.id),
      pendingReminder: reminderByRecordId.get(record.id) ?? null,
      record,
      uploadCount: uploads.filter((upload) => upload.recordId === record.id)
        .length,
      warnings: warnings.filter((warning) => warning.recordId === record.id),
    }),
  );
  const remediationFocus = enterprises
    .filter((enterprise) => enterprise.remediationFocus.length > 0)
    .map((enterprise) => ({
      items: enterprise.remediationFocus.map((summary) => ({
        source: "rule/mock",
        summary,
      })),
      recordId: enterprise.id,
      recordTitle: enterprise.title,
    }));

  return {
    analysis: {
      attentionRecords: enterprises.filter(
        (enterprise) => enterprise.complianceStatus === "attention",
      ).length,
      averageScore: enterprises.length
        ? Math.round(
            enterprises.reduce(
              (total, enterprise) => total + enterprise.governanceScore,
              0,
            ) / enterprises.length,
          )
        : 0,
      completeRecords: enterprises.filter(
        (enterprise) => enterprise.completenessStatus === "complete",
      ).length,
      duplicateFindings: enterprises.reduce(
        (total, enterprise) => total + enterprise.duplicateFindingCount,
        0,
      ),
      mockAiIndicators: enterprises.reduce(
        (total, enterprise) => total + enterprise.mockAiIndicatorCount,
        0,
      ),
      openWarnings: warnings.length,
      pendingApproval: workflows.filter(
        (workflow) => workflow.status === "pending",
      ).length,
      remediationRecords: enterprises.filter(
        (enterprise) =>
          enterprise.complianceStatus === "remediation" ||
          enterprise.complianceStatus === "blocked",
      ).length,
      totalEnterprises: enterprises.length,
    },
    enterprises,
    remediationFocus,
  };
}

export async function getGovernanceHomepageOverview() {
  await ensureGovernanceData();
  await completeDueAiJobs();

  const [records, reminders, warnings, workflows, uploads, jobs, templates] =
    await Promise.all([
      db.select().from(governanceRecordsTable).all(),
      db
        .select()
        .from(governanceRemindersTable)
        .where(eq(governanceRemindersTable.status, "pending"))
        .all(),
      db
        .select()
        .from(governanceRiskWarningsTable)
        .where(eq(governanceRiskWarningsTable.status, "open"))
        .all(),
      db
        .select()
        .from(governanceWorkflowInstancesTable)
        .where(eq(governanceWorkflowInstancesTable.status, "pending"))
        .all(),
      db.select().from(governanceUploadsTable).all(),
      db
        .select()
        .from(governanceAiJobsTable)
        .where(eq(governanceAiJobsTable.status, "processing"))
        .all(),
      db.select().from(governanceTemplatesTable).all(),
    ]);
  const recordById = new Map(records.map((record) => [record.id, record]));
  const assets = records.map((record) =>
    toAssetLedgerItem({
      activeWarningCount: warnings.filter(
        (warning) => warning.recordId === record.id,
      ).length,
      record,
      uploadCount: uploads.filter((upload) => upload.recordId === record.id)
        .length,
      warnings: warnings.filter((warning) => warning.recordId === record.id),
    }),
  );
  const missingFieldTodos: GovernanceTodoItem[] = records
    .filter((record) => hasRequiredFieldGap(getPersistedNormalizedFields(record)))
    .map((record) => ({
      action: "补齐治理必填字段",
      priority: "medium",
      recordId: record.id,
      recordTitle: record.title,
      sourceType: "missing_field",
      summary: "登记编号、权属人或地址存在缺失。",
    }));
  const leaseTodos: GovernanceTodoItem[] = assets
    .filter(
      (asset) =>
        asset.leaseExpiryStatus === "expired" ||
        asset.leaseExpiryStatus === "expiring_soon",
    )
    .map((asset) => ({
      action: "复核租赁到期安排",
      priority: asset.leaseExpiryStatus === "expired" ? "high" : "medium",
      recordId: asset.id,
      recordTitle: asset.title,
      sourceType: "expiring_lease",
      summary: `${asset.propertyNumber} 租期状态：${asset.leaseExpiryStatus}。`,
    }));
  const todos: GovernanceTodoItem[] = [
    ...workflows.map((workflow) => ({
      action: `处理${workflow.currentNodeName}`,
      priority: "high" as const,
      recordId: workflow.recordId,
      recordTitle: recordById.get(workflow.recordId)?.title ?? workflow.recordId,
      sourceType: "workflow" as const,
      summary: "审批流程存在待处理节点。",
    })),
    ...reminders.map((reminder) => ({
      action: "处理提醒",
      priority: "normal" as const,
      recordId: reminder.recordId,
      recordTitle: recordById.get(reminder.recordId)?.title ?? reminder.recordId,
      sourceType: "reminder" as const,
      summary: reminder.summary,
    })),
    ...warnings.map((warning) => ({
      action: "处置风险预警",
      priority: getTodoPriority(warning.severity),
      recordId: warning.recordId,
      recordTitle: recordById.get(warning.recordId)?.title ?? warning.recordId,
      sourceType: "risk_warning" as const,
      summary: warning.reason,
    })),
    ...jobs.map((job) => ({
      action: "刷新 Mock AI 结果",
      priority: "normal" as const,
      recordId: job.recordId,
      recordTitle: recordById.get(job.recordId)?.title ?? job.recordId,
      sourceType: "mock_ai_review" as const,
      summary: `${job.processorName} 仍在处理中，结果为 Mock 输出。`,
    })),
    ...missingFieldTodos,
    ...leaseTodos,
  ];

  return {
    dashboard: {
      activeWarnings: warnings.length,
      aiJobsProcessing: jobs.length,
      assets: assets.length,
      enterpriseRecords: records.length,
      expiringLeases: leaseTodos.length,
      missingRequiredFields: missingFieldTodos.length,
      mockAiReviewItems: jobs.length,
      records: records.length,
      templateCount: templates.length,
      todoItems: todos.length,
      uploads: uploads.length,
      workflowPending: workflows.length,
    } satisfies GovernanceDashboard,
    todos,
  };
}

export async function getGovernanceDashboard() {
  const overview = await getGovernanceHomepageOverview();

  return overview.dashboard;
}

export async function getGovernanceRecordDetail(recordId: string) {
  await ensureGovernanceData();
  await completeDueAiJobs(recordId);

  const record = await db
    .select()
    .from(governanceRecordsTable)
    .where(eq(governanceRecordsTable.id, recordId))
    .get();

  if (!record) {
    throw new AdminServiceError("未找到指定治理记录。", 404);
  }

  const [
    findings,
    reminders,
    workflowEvents,
    uploads,
    workflowInstances,
    aiJobs,
    riskWarnings,
  ] = await Promise.all([
    db
      .select()
      .from(governanceFindingsTable)
      .where(eq(governanceFindingsTable.recordId, recordId))
      .orderBy(desc(governanceFindingsTable.createdAt))
      .all(),
    db
      .select()
      .from(governanceRemindersTable)
      .where(eq(governanceRemindersTable.recordId, recordId))
      .orderBy(desc(governanceRemindersTable.createdAt))
      .all(),
    db
      .select()
      .from(governanceWorkflowEventsTable)
      .where(eq(governanceWorkflowEventsTable.recordId, recordId))
      .orderBy(asc(governanceWorkflowEventsTable.createdAt))
      .all(),
    db
      .select()
      .from(governanceUploadsTable)
      .where(eq(governanceUploadsTable.recordId, recordId))
      .orderBy(desc(governanceUploadsTable.createdAt))
      .all(),
    db
      .select()
      .from(governanceWorkflowInstancesTable)
      .where(eq(governanceWorkflowInstancesTable.recordId, recordId))
      .orderBy(desc(governanceWorkflowInstancesTable.updatedAt))
      .all(),
    db
      .select()
      .from(governanceAiJobsTable)
      .where(eq(governanceAiJobsTable.recordId, recordId))
      .orderBy(desc(governanceAiJobsTable.createdAt))
      .all(),
    db
      .select()
      .from(governanceRiskWarningsTable)
      .where(eq(governanceRiskWarningsTable.recordId, recordId))
      .orderBy(desc(governanceRiskWarningsTable.updatedAt))
      .all(),
  ]);

  return {
    ...toRecordSummary({
      ...record,
      activeWarningCount: riskWarnings.filter(
        (warning) => warning.status === "open",
      ).length,
      pendingReminder:
        reminders.find((reminder) => reminder.status === "pending")?.summary ??
        null,
      uploadCount: uploads.length,
    }),
    aiEvidence: record.aiEvidence,
    aiJobs: aiJobs.map(toAiJob),
    findings: findings.map(toFinding),
    normalizedFields: getPersistedNormalizedFields(record),
    reminders: reminders.map(toReminder),
    riskWarnings: riskWarnings.map(toRiskWarning),
    uploads: uploads.map(toUpload),
    workflowEvents: workflowEvents.map(toWorkflowEvent),
    workflowInstance: workflowInstances[0]
      ? toWorkflowInstance(workflowInstances[0])
      : null,
  } satisfies GovernanceRecordDetail;
}

export async function createGovernanceIntake(
  input: CreateGovernanceIntakeInput,
  sessionUser: AdminSessionUser,
  request?: Request,
) {
  return createGovernanceRecord(input, sessionUser, request);
}

export async function createGovernanceRecord(
  input: CreateGovernanceRecordInput,
  sessionUser: AdminSessionUser,
  request?: Request,
) {
  await ensureGovernanceData();

  const recordId = await createRecordInternal({
    fields: input.manualFields,
    mockScenarioId: input.mockScenarioId,
    originalFilename: input.originalFilename,
    sessionUser,
    sourceType: input.sourceType,
  });

  await recordAuditLog({
    action: input.sourceType === "manual" ? "手动创建治理记录" : "创建治理导入记录",
    actor: createAdminAuditActor(sessionUser),
    metadata: {
      sourceType: input.sourceType,
    },
    module: "治理平台",
    request,
    summary: `${sessionUser.displayName} 创建治理业务记录。`,
    target: {
      id: recordId,
      name: recordId,
      type: "governance_record",
    },
  });

  return getGovernanceRecordDetail(recordId);
}

export async function updateGovernanceRecord(
  recordId: string,
  input: UpdateGovernanceRecordInput,
  sessionUser: AdminSessionUser,
  request?: Request,
) {
  await ensureGovernanceData();

  const record = await db
    .select()
    .from(governanceRecordsTable)
    .where(eq(governanceRecordsTable.id, recordId))
    .get();

  if (!record) {
    throw new AdminServiceError("未找到指定治理记录。", 404);
  }

  const fields = normalizeGovernanceFields(
    record.sourceType,
    isGovernanceMockScenarioId(record.mockScenarioId)
      ? record.mockScenarioId
      : "normal-success",
    {
      ...getPersistedNormalizedFields(record),
      ...input.fields,
    },
  );

  validateRecordFields(fields);

  const now = new Date();

  await db
    .update(governanceRecordsTable)
    .set({
      businessType: fields.businessType,
      entityName: fields.entityName,
      normalizedFields: fields,
      ownerName: fields.ownerName,
      propertyAddress: fields.propertyAddress,
      status:
        record.status === "manual_correction_required"
          ? "approval_pending"
          : record.status,
      title: buildTitle(fields),
      updatedAt: now,
    })
    .where(eq(governanceRecordsTable.id, recordId));

  await resolvePendingReminders(recordId, "correction");
  await appendWorkflowEvent({
    actor: sessionUser,
    action: "更新业务记录",
    metadata: { fields },
    recordId,
    result: "completed",
    step: "record_update",
    summary: "业务结构化字段已更新，原始创建来源保留。",
  });
  await runGovernanceChecks(recordId);
  await recordAuditLog({
    action: "更新治理记录",
    actor: createAdminAuditActor(sessionUser),
    module: "治理平台",
    request,
    summary: `${sessionUser.displayName} 更新治理记录 ${record.title}。`,
    target: {
      id: recordId,
      name: record.title,
      type: "governance_record",
    },
  });

  return getGovernanceRecordDetail(recordId);
}

function getFileExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");

  return index >= 0 ? fileName.slice(index).toLowerCase() : "";
}

function inferFileType(category: GovernanceUploadCategory) {
  switch (category) {
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "excel":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "image":
      return "image/*";
  }
}

function validateUploadInput(
  input: CreateGovernanceUploadInput,
  template?: typeof governanceTemplatesTable.$inferSelect | null,
) {
  const messages: string[] = [];

  if (!isGovernanceUploadCategory(input.category)) {
    return {
      messages: ["不支持的上传分类。"],
      status: "rejected" as const,
    };
  }

  if (!input.fileName.trim()) {
    return {
      messages: ["请提供文件名。"],
      status: "rejected" as const,
    };
  }

  const extension = getFileExtension(input.fileName);
  const allowedExtensions =
    template?.allowedExtensions ??
    governanceTemplateRegistry.find(
      (item) => item.category === input.category,
    )?.allowedExtensions ??
    [];

  if (!allowedExtensions.includes(extension)) {
    return {
      messages: [`文件类型不支持，允许格式：${allowedExtensions.join(", ")}。`],
      status: "rejected" as const,
    };
  }

  const maxSizeMb =
    template?.maxSizeMb ??
    governanceTemplateRegistry.find((item) => item.category === input.category)
      ?.maxSizeMb ??
    10;

  if (input.fileSize <= 0 || input.fileSize > maxSizeMb * 1024 * 1024) {
    return {
      messages: [`文件大小需在 1 字节至 ${maxSizeMb}MB 之间。`],
      status: "rejected" as const,
    };
  }

  if (!template) {
    messages.push("未关联模板，已按文件类型完成基础校验。");
  }

  if (input.fileName.toLowerCase().includes("draft")) {
    messages.push("文件名包含 draft，建议确认是否为最终版本。");
  }

  return {
    messages: messages.length ? messages : ["上传校验通过。"],
    status: messages.length ? ("warning" as const) : ("accepted" as const),
  };
}

async function createUploadInternal(
  recordId: string,
  input: CreateGovernanceUploadInput,
  sessionUser: AdminSessionUser,
  options?: {
    allowRejectedPersistence?: boolean;
    scenarioRunId?: string | null;
  },
) {
  const record = await db
    .select()
    .from(governanceRecordsTable)
    .where(eq(governanceRecordsTable.id, recordId))
    .get();

  if (!record) {
    throw new AdminServiceError("未找到指定治理记录。", 404);
  }

  const template = input.templateKey
    ? await db
        .select()
        .from(governanceTemplatesTable)
        .where(eq(governanceTemplatesTable.key, input.templateKey))
        .get()
    : null;

  if (input.templateKey && !template) {
    throw new AdminServiceError("请求的模板未配置，不能创建上传记录。", 404);
  }

  const validation = validateUploadInput(input, template);

  if (
    validation.status === "rejected" &&
    options?.allowRejectedPersistence !== true
  ) {
    throw new AdminServiceError(validation.messages[0], 400);
  }

  const now = new Date();
  const uploadId = randomUUID();

  await db.insert(governanceUploadsTable).values({
    category: input.category,
    createdAt: now,
    fileName: input.fileName.trim(),
    fileSize: input.fileSize,
    fileType: inferFileType(input.category),
    id: uploadId,
    recordId,
    scenarioRunId: options?.scenarioRunId ?? null,
    templateKey: input.templateKey ?? null,
    uploaderName: sessionUser.displayName,
    uploaderUserId: sessionUser.id,
    validationMessages: validation.messages,
    validationStatus: validation.status,
  });

  await resolvePendingReminders(recordId, "upload");
  await appendWorkflowEvent({
    actor: sessionUser,
    action: "上传业务材料",
    metadata: {
      category: input.category,
      fileName: input.fileName,
      templateKey: input.templateKey ?? null,
      validation,
    },
    recordId,
    result: validation.status,
    step: "upload",
    summary: `已保存 ${input.fileName} 上传元数据，校验结果：${validation.status}。`,
  });
  await runGovernanceChecks(recordId);

  return uploadId;
}

export async function createGovernanceUpload(
  recordId: string,
  input: CreateGovernanceUploadInput,
  sessionUser: AdminSessionUser,
  request?: Request,
) {
  await ensureGovernanceData();

  const uploadId = await createUploadInternal(recordId, input, sessionUser);

  await recordAuditLog({
    action: "上传治理材料",
    actor: createAdminAuditActor(sessionUser),
    metadata: input,
    module: "治理平台",
    request,
    summary: `${sessionUser.displayName} 为治理记录上传 ${input.fileName}。`,
    target: {
      id: recordId,
      name: input.fileName,
      type: "governance_record",
    },
  });

  return getGovernanceRecordDetail(recordId).then((record) => ({
    record,
    uploadId,
  }));
}

export async function listGovernanceTemplates() {
  await ensureGovernanceData();

  const templates = await db
    .select()
    .from(governanceTemplatesTable)
    .orderBy(asc(governanceTemplatesTable.category))
    .all();

  return templates.map(toTemplate);
}

export async function getGovernanceTemplateDownload(
  templateKey: string,
  sessionUser: AdminSessionUser,
  request?: Request,
) {
  await ensureGovernanceData();

  const template = await db
    .select()
    .from(governanceTemplatesTable)
    .where(eq(governanceTemplatesTable.key, templateKey))
    .get();

  if (!template) {
    throw new AdminServiceError("请求的模板未配置。", 404);
  }

  if (template.auditEnabled) {
    await recordAuditLog({
      action: "下载治理模板",
      actor: createAdminAuditActor(sessionUser),
      metadata: { templateKey },
      module: "治理平台",
      request,
      summary: `${sessionUser.displayName} 下载模板 ${template.label}。`,
      target: {
        id: template.key,
        name: template.label,
        type: "governance_template",
      },
    });
  }

  return {
    content: template.content,
    filename: template.filename,
    template: toTemplate(template),
  };
}

async function getLatestWorkflowInstance(recordId: string) {
  return db
    .select()
    .from(governanceWorkflowInstancesTable)
    .where(eq(governanceWorkflowInstancesTable.recordId, recordId))
    .orderBy(desc(governanceWorkflowInstancesTable.updatedAt))
    .get();
}

function getNextWorkflowNode(currentNodeKey: string, hasWarnings: boolean) {
  if (currentNodeKey === "department_review") {
    return hasWarnings
      ? {
          assigneeRole: "risk_analyst",
          key: "risk_review",
          name: "风险复核",
        }
      : {
          assigneeRole: "workflow_approver",
          key: "archive_review",
          name: "归档复核",
        };
  }

  if (currentNodeKey === "risk_review") {
    return {
      assigneeRole: "workflow_approver",
      key: "archive_review",
      name: "归档复核",
    };
  }

  return null;
}

async function submitWorkflowInternal(
  recordId: string,
  sessionUser: AdminSessionUser,
  scenarioRunId?: string | null,
) {
  const record = await db
    .select()
    .from(governanceRecordsTable)
    .where(eq(governanceRecordsTable.id, recordId))
    .get();

  if (!record) {
    throw new AdminServiceError("未找到指定治理记录。", 404);
  }

  const fields = getPersistedNormalizedFields(record);

  if (
    hasMissingValue(fields.entityName) ||
    hasMissingValue(fields.propertyAddress)
  ) {
    throw new AdminServiceError("业务记录不满足流程入口规则：主体和地址必须完整。");
  }

  const existing = await getLatestWorkflowInstance(recordId);

  if (existing && existing.status === "pending") {
    throw new AdminServiceError("该记录已在审批流程中。", 409);
  }

  const now = new Date();
  const activeWarnings = await db
    .select()
    .from(governanceRiskWarningsTable)
    .where(
      and(
        eq(governanceRiskWarningsTable.recordId, recordId),
        eq(governanceRiskWarningsTable.status, "open"),
      ),
    )
    .all();
  const initialNode = activeWarnings.length
    ? { assigneeRole: "risk_analyst", key: "risk_review", name: "风险复核" }
    : {
        assigneeRole: "workflow_approver",
        key: "department_review",
        name: "部门初审",
      };

  await db.insert(governanceWorkflowInstancesTable).values({
    assigneeRole: initialNode.assigneeRole,
    assigneeUserId: null,
    completedAt: null,
    currentNodeKey: initialNode.key,
    currentNodeName: initialNode.name,
    id: randomUUID(),
    recordId,
    scenarioRunId: scenarioRunId ?? null,
    status: "pending",
    submittedAt: now,
    updatedAt: now,
  });

  await db
    .update(governanceRecordsTable)
    .set({
      status: activeWarnings.length ? "risk_review_required" : "approval_pending",
      updatedAt: now,
    })
    .where(eq(governanceRecordsTable.id, recordId));

  await createReminder(recordId, "workflow", `${initialNode.name}待处理。`);
  await appendWorkflowEvent({
    actor: sessionUser,
    action: "提交审批",
    metadata: { initialNode },
    recordId,
    result: "pending",
    step: "workflow_submission",
    summary: `业务记录进入${initialNode.name}节点。`,
  });
}

export async function submitGovernanceWorkflow(
  recordId: string,
  sessionUser: AdminSessionUser,
  request?: Request,
) {
  await ensureGovernanceData();
  await submitWorkflowInternal(recordId, sessionUser);
  await recordAuditLog({
    action: "提交治理审批",
    actor: createAdminAuditActor(sessionUser),
    module: "治理平台",
    request,
    summary: `${sessionUser.displayName} 提交治理记录审批。`,
    target: {
      id: recordId,
      name: recordId,
      type: "governance_record",
    },
  });

  return getGovernanceRecordDetail(recordId);
}

async function authorizeWorkflowAction(
  instance: typeof governanceWorkflowInstancesTable.$inferSelect,
  sessionUser: AdminSessionUser,
) {
  const canAct =
    sessionUser.roleKey === "root" ||
    sessionUser.roleKey === "admin" ||
    sessionUser.roleKey === instance.assigneeRole ||
    instance.assigneeUserId === sessionUser.id;

  if (!canAct) {
    throw new AdminServiceError("当前账号无权处置该流程节点。", 403);
  }
}

async function persistFinalOutcome(input: {
  outcomeStatus: "approved" | "archived" | "rejected" | "escalated";
  reason?: string | null;
  recordId: string;
  sessionUser: AdminSessionUser;
}) {
  const now = new Date();

  await db.insert(governanceFinalOutcomesTable).values({
    createdAt: now,
    createdByUserId: input.sessionUser.id,
    id: randomUUID(),
    reason: input.reason ?? null,
    recordId: input.recordId,
    source: "workflow_action",
    status: input.outcomeStatus,
  });

  await db
    .update(governanceRecordsTable)
    .set({
      finalOutcomeReason: input.reason ?? null,
      finalOutcomeSource: "workflow_action",
      finalOutcomeStatus: input.outcomeStatus,
      status:
        input.outcomeStatus === "approved"
          ? "approved"
          : input.outcomeStatus === "archived"
            ? "archived"
            : input.outcomeStatus === "rejected"
              ? "rejected"
              : "escalated",
      updatedAt: now,
    })
    .where(eq(governanceRecordsTable.id, input.recordId));
}

export async function applyGovernanceWorkflowAction(
  recordId: string,
  input: GovernanceWorkflowActionInput,
  sessionUser: AdminSessionUser,
  request?: Request,
) {
  await ensureGovernanceData();

  const record = await db
    .select()
    .from(governanceRecordsTable)
    .where(eq(governanceRecordsTable.id, recordId))
    .get();

  if (!record) {
    throw new AdminServiceError("未找到指定治理记录。", 404);
  }

  if (input.workflowAction === "correct") {
    return updateGovernanceRecord(
      recordId,
      { fields: input.correctedFields ?? {} },
      sessionUser,
      request,
    );
  }

  const instance = await getLatestWorkflowInstance(recordId);

  if (!instance || instance.status !== "pending") {
    throw new AdminServiceError("该记录没有待处理的审批流程。", 409);
  }

  await authorizeWorkflowAction(instance, sessionUser);

  const reason = input.reason?.trim() || null;

  if (
    (input.workflowAction === "reject" || input.workflowAction === "return") &&
    !reason
  ) {
    throw new AdminServiceError("驳回或退回必须填写审批意见。");
  }

  const now = new Date();

  if (input.workflowAction === "transfer") {
    await db
      .update(governanceWorkflowInstancesTable)
      .set({
        assigneeUserId: input.assigneeUserId ?? null,
        updatedAt: now,
      })
      .where(eq(governanceWorkflowInstancesTable.id, instance.id));
    await appendWorkflowEvent({
      actor: sessionUser,
      action: "转交流程",
      metadata: { assigneeUserId: input.assigneeUserId ?? null },
      reason,
      recordId,
      result: "pending",
      step: instance.currentNodeKey,
      summary: "流程节点已转交给指定处理人或角色队列。",
    });
  } else if (input.workflowAction === "reject") {
    await db
      .update(governanceWorkflowInstancesTable)
      .set({
        completedAt: now,
        status: "rejected",
        updatedAt: now,
      })
      .where(eq(governanceWorkflowInstancesTable.id, instance.id));
    await persistFinalOutcome({
      outcomeStatus: "rejected",
      reason,
      recordId,
      sessionUser,
    });
    await resolvePendingReminders(recordId);
    await appendWorkflowEvent({
      actor: sessionUser,
      action: "驳回记录",
      reason,
      recordId,
      result: "rejected",
      step: instance.currentNodeKey,
      summary: "审批流程已驳回并写入最终结果。",
    });
  } else if (input.workflowAction === "return") {
    await db
      .update(governanceWorkflowInstancesTable)
      .set({
        completedAt: now,
        status: "returned",
        updatedAt: now,
      })
      .where(eq(governanceWorkflowInstancesTable.id, instance.id));
    await db
      .update(governanceRecordsTable)
      .set({
        status: "manual_correction_required",
        updatedAt: now,
      })
      .where(eq(governanceRecordsTable.id, recordId));
    await resolvePendingReminders(recordId);
    await createReminder(recordId, "correction", "流程退回，需要补正后重新提交。");
    await appendWorkflowEvent({
      actor: sessionUser,
      action: "退回补正",
      reason,
      recordId,
      result: "returned",
      step: instance.currentNodeKey,
      summary: "审批流程退回至业务补正状态。",
    });
  } else {
    const warnings = await db
      .select()
      .from(governanceRiskWarningsTable)
      .where(
        and(
          eq(governanceRiskWarningsTable.recordId, recordId),
          eq(governanceRiskWarningsTable.status, "open"),
        ),
      )
      .all();
    const nextNode =
      input.workflowAction === "archive"
        ? null
        : getNextWorkflowNode(instance.currentNodeKey, warnings.length > 0);

    if (nextNode) {
      await db
        .update(governanceWorkflowInstancesTable)
        .set({
          assigneeRole: nextNode.assigneeRole,
          assigneeUserId: null,
          currentNodeKey: nextNode.key,
          currentNodeName: nextNode.name,
          updatedAt: now,
        })
        .where(eq(governanceWorkflowInstancesTable.id, instance.id));
      await resolvePendingReminders(recordId, "workflow");
      await createReminder(recordId, "workflow", `${nextNode.name}待处理。`);
      await appendWorkflowEvent({
        actor: sessionUser,
        action: "审批通过",
        reason,
        recordId,
        result: "pending",
        step: instance.currentNodeKey,
        summary: `当前节点通过，流转至${nextNode.name}。`,
      });
    } else {
      const scenario = isGovernanceMockScenarioId(record.mockScenarioId)
        ? governanceMockScenarios[record.mockScenarioId]
        : governanceMockScenarios["normal-success"];
      const outcomeStatus =
        input.workflowAction === "archive"
          ? "archived"
          : scenario.defaultFinalOutcome;

      await db
        .update(governanceWorkflowInstancesTable)
        .set({
          completedAt: now,
          status: "completed",
          updatedAt: now,
        })
        .where(eq(governanceWorkflowInstancesTable.id, instance.id));
      await persistFinalOutcome({
        outcomeStatus,
        reason,
        recordId,
        sessionUser,
      });
      await resolvePendingReminders(recordId);
      await appendWorkflowEvent({
        actor: sessionUser,
        action: input.workflowAction === "archive" ? "归档记录" : "审批完成",
        reason,
        recordId,
        result: "completed",
        step: instance.currentNodeKey,
        summary: "审批流程已完成并写入最终结果。",
      });
    }
  }

  await recordAuditLog({
    action: "处置治理流程",
    actor: createAdminAuditActor(sessionUser),
    metadata: {
      workflowAction: input.workflowAction,
    },
    module: "治理平台",
    request,
    summary: `${sessionUser.displayName} 对治理记录 ${record.title} 执行 ${input.workflowAction}。`,
    target: {
      id: record.id,
      name: record.title,
      type: "governance_record",
    },
  });

  return getGovernanceRecordDetail(recordId);
}

async function createAiJobInternal(
  recordId: string,
  input: StartGovernanceAiJobInput,
  sessionUser: AdminSessionUser,
  options?: {
    forceComplete?: boolean;
    scenarioRunId?: string | null;
  },
) {
  const record = await db
    .select()
    .from(governanceRecordsTable)
    .where(eq(governanceRecordsTable.id, recordId))
    .get();

  if (!record) {
    throw new AdminServiceError("未找到指定治理记录。", 404);
  }

  const processor = getProcessor(input.processorName);

  if (!processor) {
    throw new AdminServiceError("未知 Mock AI 处理器，不创建完成结果。", 404);
  }

  const scenario = isGovernanceMockScenarioId(record.mockScenarioId)
    ? governanceMockScenarios[record.mockScenarioId]
    : governanceMockScenarios["normal-success"];
  const scenarioRiskIndicators = scenario.validationFindings
    .filter((finding) => finding.severity !== "info")
    .map((finding) => finding.kind);
  const riskIndicators = Array.from(
    new Set([...processor.riskIndicators, ...scenarioRiskIndicators]),
  );
  const now = new Date();
  const delayMs = options?.forceComplete ? 0 : processor.delayMs;
  const jobId = randomUUID();

  await db.insert(governanceAiJobsTable).values({
    completedAt: options?.forceComplete ? now : null,
    completesAt: new Date(now.getTime() + delayMs),
    createdAt: now,
    delayMs,
    id: jobId,
    inputReference: input.inputReference?.trim() || recordId,
    mockSource: "configured-fixture",
    outputPayload: options?.forceComplete
      ? {
          boundary: "mock",
          processorName: processor.name,
          scenarioId: record.mockScenarioId,
        }
      : null,
    outputSummary: options?.forceComplete ? processor.outputSummary : null,
    processorName: processor.name,
    recordId,
    riskIndicators,
    scenarioRunId: options?.scenarioRunId ?? null,
    status: options?.forceComplete ? "completed" : "processing",
  });

  await appendWorkflowEvent({
    actor: sessionUser,
    action: "启动 Mock AI 处理",
    metadata: {
      boundary: "mock",
      delayMs,
      jobId,
      processorName: processor.name,
    },
    recordId,
    result: options?.forceComplete ? "completed" : "processing",
    step: "ai_mock_processing",
    summary: `${processor.name} 已启动，输出来自确定性 Mock 配置。`,
  });

  if (options?.forceComplete) {
    for (const indicator of riskIndicators) {
      await createRiskWarning({
        reason: `Mock AI 指标命中：${indicator}`,
        recordId,
        relatedJobId: jobId,
        remediationHint: "该结果来自 Mock AI，请结合真实业务材料人工复核后处置。",
        scenarioRunId: options.scenarioRunId,
        severity: indicator.includes("conflict") ? "critical" : "warning",
        source: `mock-ai:${processor.name}`,
      });
    }
    await db
      .update(governanceRecordsTable)
      .set({
        aiEvidence: {
          mockSource: "configured-processor",
          processorName: processor.name,
          result: processor.outputSummary,
          scenarioEvidence: scenario.aiEvidence,
        },
        status: "ai_recognized",
        updatedAt: now,
      })
      .where(eq(governanceRecordsTable.id, recordId));
    await runGovernanceChecks(recordId);
  }

  return jobId;
}

export async function startGovernanceAiJob(
  recordId: string,
  input: StartGovernanceAiJobInput,
  sessionUser: AdminSessionUser,
  request?: Request,
) {
  await ensureGovernanceData();

  const jobId = await createAiJobInternal(recordId, input, sessionUser);

  await recordAuditLog({
    action: "启动 Mock AI 处理",
    actor: createAdminAuditActor(sessionUser),
    metadata: {
      processorName: input.processorName,
    },
    module: "治理平台",
    request,
    summary: `${sessionUser.displayName} 启动 ${input.processorName}。`,
    target: {
      id: recordId,
      name: input.processorName,
      type: "governance_record",
    },
  });

  return getGovernanceRecordDetail(recordId).then((record) => ({
    jobId,
    record,
  }));
}

export async function pollGovernanceAiJobs(recordId: string) {
  await ensureGovernanceData();
  await completeDueAiJobs(recordId);

  return getGovernanceRecordDetail(recordId);
}

export async function listGovernanceWarnings() {
  await ensureGovernanceData();
  await completeDueAiJobs();

  const warnings = await db
    .select()
    .from(governanceRiskWarningsTable)
    .orderBy(desc(governanceRiskWarningsTable.updatedAt))
    .all();

  return warnings.map(toRiskWarning);
}

export async function listPendingGovernanceTasks() {
  await ensureGovernanceData();

  const instances = await db
    .select()
    .from(governanceWorkflowInstancesTable)
    .where(eq(governanceWorkflowInstancesTable.status, "pending"))
    .orderBy(asc(governanceWorkflowInstancesTable.submittedAt))
    .all();
  const records = await db.select().from(governanceRecordsTable).all();
  const recordById = new Map(records.map((record) => [record.id, record]));

  return instances.map((instance) => {
    const record = recordById.get(instance.recordId);

    return {
      assigneeRole: instance.assigneeRole,
      createdAt: formatAdminDate(instance.submittedAt) ?? "",
      currentNodeName: instance.currentNodeName,
      recordId: instance.recordId,
      recordTitle: record?.title ?? instance.recordId,
      status: instance.status,
    };
  });
}

export async function listGovernanceScenarioRuns() {
  await ensureGovernanceData();

  const runs = await db
    .select()
    .from(governanceScenarioRunsTable)
    .orderBy(desc(governanceScenarioRunsTable.updatedAt))
    .all();

  return runs.map(toScenarioRun);
}

export async function startGovernanceScenarioRun(
  bundleKey: string,
  sessionUser: AdminSessionUser,
  request?: Request,
) {
  await ensureGovernanceData();

  const bundle = governanceScenarioBundles[bundleKey];

  if (!bundle) {
    throw new AdminServiceError("未知场景包，未创建任何场景数据。", 404);
  }

  const now = new Date();
  const runId = randomUUID();

  await db.insert(governanceScenarioRunsTable).values({
    bundleKey,
    completedAt: null,
    createdAt: now,
    createdByUserId: sessionUser.id,
    currentStep: 0,
    id: runId,
    label: bundle.label,
    status: "running",
    totalSteps: bundle.steps.length,
    updatedAt: now,
  });

  const recordId = await createRecordInternal({
    allowDuplicate: true,
    mockScenarioId: bundle.scenarioId,
    originalFilename: bundle.originalFilename,
    scenarioRunId: runId,
    sessionUser,
    sourceType: bundle.sourceType,
  });

  await appendWorkflowEvent({
    actor: sessionUser,
    action: "启动场景包",
    metadata: {
      bundleKey,
      runId,
    },
    recordId,
    result: "running",
    step: "scenario",
    summary: `${bundle.label} 已创建场景数据并标记运行 ID。`,
  });
  await recordAuditLog({
    action: "启动治理场景",
    actor: createAdminAuditActor(sessionUser),
    metadata: { bundleKey, runId },
    module: "治理平台",
    request,
    summary: `${sessionUser.displayName} 启动场景 ${bundle.label}。`,
    target: {
      id: runId,
      name: bundle.label,
      type: "governance_scenario",
    },
  });

  return {
    record: await getGovernanceRecordDetail(recordId),
    run: await getScenarioRunById(runId),
  };
}

async function getScenarioRunById(runId: string) {
  const run = await db
    .select()
    .from(governanceScenarioRunsTable)
    .where(eq(governanceScenarioRunsTable.id, runId))
    .get();

  if (!run) {
    throw new AdminServiceError("未找到指定场景运行。", 404);
  }

  return toScenarioRun(run);
}

async function getScenarioRecord(runId: string) {
  const events = await db
    .select()
    .from(governanceWorkflowEventsTable)
    .where(eq(governanceWorkflowEventsTable.step, "scenario"))
    .orderBy(desc(governanceWorkflowEventsTable.createdAt))
    .all();
  const event = events.find((item) => item.metadata?.["runId"] === runId);

  if (!event) {
    throw new AdminServiceError("场景运行未关联业务记录。", 404);
  }

  return event.recordId;
}

export async function advanceGovernanceScenarioRun(
  runId: string,
  sessionUser: AdminSessionUser,
  request?: Request,
) {
  await ensureGovernanceData();

  const run = await db
    .select()
    .from(governanceScenarioRunsTable)
    .where(eq(governanceScenarioRunsTable.id, runId))
    .get();

  if (!run) {
    throw new AdminServiceError("未找到指定场景运行。", 404);
  }

  if (run.status !== "running") {
    throw new AdminServiceError("该场景运行已结束，不能继续推进。", 409);
  }

  const bundle = governanceScenarioBundles[run.bundleKey];
  const recordId = await getScenarioRecord(runId);
  const nextStep = run.currentStep + 1;

  if (nextStep === 1) {
    await createUploadInternal(
      recordId,
      {
        category: bundle.sourceType === "excel" ? "excel" : "docx",
        fileName: bundle.originalFilename,
        fileSize: 520_000,
        templateKey:
          bundle.sourceType === "excel"
            ? "enterprise-excel-register"
            : "real-estate-docx-intake",
      },
      sessionUser,
      { scenarioRunId: runId },
    );
  } else if (nextStep === 2) {
    await submitWorkflowInternal(recordId, sessionUser, runId);
  } else if (nextStep === 3) {
    await createAiJobInternal(
      recordId,
      {
        inputReference: recordId,
        processorName:
          bundle.scenarioId === "risk-warning" ? "risk-scan" : "ownership-extraction",
      },
      sessionUser,
      {
        forceComplete: true,
        scenarioRunId: runId,
      },
    );
  } else if (nextStep === 4) {
    await runGovernanceChecks(recordId);
    await appendWorkflowEvent({
      actor: sessionUser,
      action: "场景预警复核",
      metadata: { runId },
      recordId,
      result: "reviewable",
      step: "scenario_warning",
      summary: "场景已推进到可复核预警状态，结果数据保留在业务记录中。",
    });
  }

  const now = new Date();
  const isComplete = nextStep >= run.totalSteps;

  await db
    .update(governanceScenarioRunsTable)
    .set({
      completedAt: isComplete ? now : null,
      currentStep: Math.min(nextStep, run.totalSteps),
      status: isComplete ? "completed" : "running",
      updatedAt: now,
    })
    .where(eq(governanceScenarioRunsTable.id, runId));

  await recordAuditLog({
    action: "推进治理场景",
    actor: createAdminAuditActor(sessionUser),
    metadata: { nextStep, runId },
    module: "治理平台",
    request,
    summary: `${sessionUser.displayName} 推进场景 ${run.label}。`,
    target: {
      id: runId,
      name: run.label,
      type: "governance_scenario",
    },
  });

  return {
    record: await getGovernanceRecordDetail(recordId),
    run: await getScenarioRunById(runId),
  };
}

export async function resetGovernanceScenarioRun(
  runId: string,
  sessionUser: AdminSessionUser,
  request?: Request,
) {
  await ensureGovernanceData();

  const run = await db
    .select()
    .from(governanceScenarioRunsTable)
    .where(eq(governanceScenarioRunsTable.id, runId))
    .get();

  if (!run) {
    throw new AdminServiceError("未找到指定场景运行。", 404);
  }

  const recordId = await getScenarioRecord(runId);
  const now = new Date();

  await db
    .delete(governanceRecordsTable)
    .where(eq(governanceRecordsTable.id, recordId));
  await db
    .update(governanceScenarioRunsTable)
    .set({
      completedAt: now,
      status: "reset",
      updatedAt: now,
    })
    .where(eq(governanceScenarioRunsTable.id, runId));
  await recordAuditLog({
    action: "重置治理场景",
    actor: createAdminAuditActor(sessionUser),
    metadata: { runId },
    module: "治理平台",
    request,
    summary: `${sessionUser.displayName} 重置场景 ${run.label}，仅清理该运行标记数据。`,
    target: {
      id: runId,
      name: run.label,
      type: "governance_scenario",
    },
  });

  return getScenarioRunById(runId);
}
