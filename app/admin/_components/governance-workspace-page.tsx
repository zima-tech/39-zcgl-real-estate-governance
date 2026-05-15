"use client";

import type { TableProps } from "antd";
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Timeline,
} from "antd";
import { useMemo, useState } from "react";

import { AdminPageFrame } from "@/app/admin/_components/admin-page-frame";
import { DetailDrawerShell } from "@/app/admin/_components/shared/detail-drawer-shell";
import { adminClient } from "@/lib/admin/client";
import type {
  CreateGovernanceUploadInput,
  GovernanceDashboard,
  GovernanceNormalizedFields,
  GovernanceProcessor,
  GovernanceRecordDetail,
  GovernanceRecordSummary,
  GovernanceRiskWarning,
  GovernanceScenarioRun,
  GovernanceSourceType,
  GovernanceTemplate,
  GovernanceWorkflowAction,
} from "@/lib/admin/governance-service";

type WorkflowTask = {
  assigneeRole: string;
  createdAt: string;
  currentNodeName: string;
  recordId: string;
  recordTitle: string;
  status: string;
};

type ScenarioBundleOption = {
  key: string;
  label: string;
  steps: string[];
};

export type GovernanceWorkspaceTabKey =
  | "records"
  | "templates"
  | "workflow"
  | "warnings"
  | "scenarios";

type GovernanceWorkspacePageProps = {
  initialDashboard: GovernanceDashboard;
  initialActiveTab?: GovernanceWorkspaceTabKey;
  initialProcessors: GovernanceProcessor[];
  initialRecords: GovernanceRecordSummary[];
  initialScenarioBundles: ScenarioBundleOption[];
  initialScenarioRuns: GovernanceScenarioRun[];
  initialTemplates: GovernanceTemplate[];
  initialWarnings: GovernanceRiskWarning[];
  initialWorkflowTasks: WorkflowTask[];
};

type IntakeFormValues = {
  businessType?: string;
  contactPhone?: string;
  entityName?: string;
  mockScenarioId?: string;
  originalFilename?: string;
  ownerName?: string;
  propertyAddress?: string;
  registrationNo?: string;
  riskNote?: string;
};

type UploadFormValues = CreateGovernanceUploadInput;

type ActionFormValues = {
  assigneeUserId?: string;
  businessType?: string;
  entityName?: string;
  ownerName?: string;
  propertyAddress?: string;
  reason?: string;
  registrationNo?: string;
  riskNote?: string;
};

const scenarioOptions = [
  { label: "正常通过", value: "normal-success" },
  { label: "字段缺失", value: "missing-fields" },
  { label: "数据冲突", value: "data-conflict" },
  { label: "风险预警", value: "risk-warning" },
  { label: "人工复核", value: "manual-review" },
  { label: "默认驳回", value: "rejection" },
  { label: "修正后归档", value: "corrected-archive" },
];

const sourceTypeLabels: Record<GovernanceSourceType, string> = {
  docx: "DOCX 导入",
  excel: "Excel 导入",
  image: "图片导入",
  manual: "手动录入",
  word: "Word 导入",
};

const statusLabels: Record<GovernanceRecordSummary["status"], string> = {
  ai_recognized: "Mock AI 已处理",
  approval_pending: "待审批",
  approved: "已批准",
  archived: "已归档",
  escalated: "已升级",
  human_review_required: "待复核",
  intake_completed: "已采集",
  manual_correction_required: "待补正",
  rejected: "已驳回",
  risk_review_required: "风险复核",
};

const statusColors: Record<GovernanceRecordSummary["status"], string> = {
  ai_recognized: "blue",
  approval_pending: "gold",
  approved: "cyan",
  archived: "green",
  escalated: "volcano",
  human_review_required: "orange",
  intake_completed: "default",
  manual_correction_required: "purple",
  rejected: "red",
  risk_review_required: "magenta",
};

function getScenarioLabel(scenarioId: string) {
  return (
    scenarioOptions.find((scenario) => scenario.value === scenarioId)?.label ??
    scenarioId
  );
}

function buildFields(values: IntakeFormValues | ActionFormValues) {
  return {
    businessType: values.businessType,
    contactPhone: "contactPhone" in values ? values.contactPhone : undefined,
    entityName: values.entityName,
    ownerName: values.ownerName,
    propertyAddress: values.propertyAddress,
    registrationNo: values.registrationNo,
    riskNote: values.riskNote,
  } satisfies Partial<GovernanceNormalizedFields>;
}

function isCompletedRecord(record: GovernanceRecordSummary) {
  return Boolean(record.finalOutcomeStatus);
}

function getOutcomeLabel(outcome: string | null) {
  switch (outcome) {
    case "approved":
      return "已批准";
    case "archived":
      return "已归档";
    case "escalated":
      return "已升级";
    case "rejected":
      return "已驳回";
    default:
      return "未完成";
  }
}

function getSeverityColor(severity: string) {
  if (severity === "critical") {
    return "red";
  }

  if (severity === "warning") {
    return "gold";
  }

  return "blue";
}

export function GovernanceWorkspacePage({
  initialDashboard,
  initialProcessors,
  initialRecords,
  initialScenarioBundles,
  initialScenarioRuns,
  initialTemplates,
  initialWarnings,
  initialWorkflowTasks,
}: GovernanceWorkspacePageProps) {
  const { message } = App.useApp();
  const [intakeForm] = Form.useForm<IntakeFormValues>();
  const [uploadForm] = Form.useForm<UploadFormValues>();
  const [actionForm] = Form.useForm<ActionFormValues>();
  const [records, setRecords] = useState(initialRecords);
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [templates, setTemplates] = useState(initialTemplates);
  const [warnings, setWarnings] = useState(initialWarnings);
  const [workflowTasks, setWorkflowTasks] = useState(initialWorkflowTasks);
  const [scenarioRuns, setScenarioRuns] = useState(initialScenarioRuns);
  const [scenarioBundles, setScenarioBundles] = useState(initialScenarioBundles);
  const [activeTab, setActiveTab] = useState<GovernanceWorkspaceTabKey>(
    initialActiveTab ?? "records",
  );
  const [selectedRecord, setSelectedRecord] =
    useState<GovernanceRecordDetail | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [intakeSourceType, setIntakeSourceType] =
    useState<GovernanceSourceType | null>(null);
  const [uploadRecordId, setUploadRecordId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<GovernanceWorkflowAction | null>(
    null,
  );
  const [queueFilter, setQueueFilter] = useState<
    "all" | "pending" | "correction" | "review" | "completed"
  >("all");

  async function refreshWorkspace() {
    const [
      recordsResponse,
      dashboardResponse,
      templatesResponse,
      warningsResponse,
      tasksResponse,
      scenarioResponse,
    ] = await Promise.all([
      adminClient.listGovernanceRecords(),
      adminClient.getGovernanceDashboard(),
      adminClient.listGovernanceTemplates(),
      adminClient.listGovernanceWarnings(),
      adminClient.listGovernanceWorkflowTasks(),
      adminClient.listGovernanceScenarioRuns(),
    ]);

    setRecords(recordsResponse.records);
    setDashboard(dashboardResponse.dashboard);
    setTemplates(templatesResponse.templates);
    setWarnings(warningsResponse.warnings);
    setWorkflowTasks(tasksResponse.tasks);
    setScenarioRuns(scenarioResponse.runs);
    setScenarioBundles(scenarioResponse.bundles);
  }

  async function openRecordDetail(recordId: string) {
    setSelectedRecordId(recordId);
    setIsDetailLoading(true);

    try {
      const response = await adminClient.getGovernanceRecordDetail(recordId);

      setSelectedRecord(response.record);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "读取详情失败。");
    } finally {
      setIsDetailLoading(false);
    }
  }

  function openIntakeModal(sourceType: GovernanceSourceType) {
    setIntakeSourceType(sourceType);
    intakeForm.resetFields();
  }

  async function handleCreateIntake(values: IntakeFormValues) {
    if (!intakeSourceType) {
      return;
    }

    setIsMutating(true);

    try {
      const response = await adminClient.createGovernanceIntake({
        manualFields: intakeSourceType === "manual" ? buildFields(values) : {},
        mockScenarioId: values.mockScenarioId,
        originalFilename: values.originalFilename,
        sourceType: intakeSourceType,
      });

      message.success("治理记录已创建。");
      setIntakeSourceType(null);
      setSelectedRecord(response.record);
      setSelectedRecordId(response.record.id);
      await refreshWorkspace();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "创建记录失败。");
    } finally {
      setIsMutating(false);
    }
  }

  function openUploadModal(recordId: string) {
    setUploadRecordId(recordId);
    uploadForm.resetFields();
  }

  async function handleUpload(values: UploadFormValues) {
    if (!uploadRecordId) {
      return;
    }

    setIsMutating(true);

    try {
      const response = await adminClient.createGovernanceUpload(
        uploadRecordId,
        values,
      );

      message.success("上传元数据已保存。");
      setUploadRecordId(null);
      setSelectedRecord(response.record);
      await refreshWorkspace();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "上传失败。");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleTemplateDownload(templateKey: string) {
    setIsMutating(true);

    try {
      const response = await adminClient.downloadGovernanceTemplate(templateKey);
      const blob = new Blob([response.content], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = response.filename;
      link.click();
      URL.revokeObjectURL(url);

      message.success(`模板 ${response.filename} 已下载。`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "模板不可用。");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleSubmitWorkflow(recordId: string) {
    setIsMutating(true);

    try {
      const response = await adminClient.submitGovernanceWorkflow(recordId);

      message.success("已提交审批流程。");
      setSelectedRecord(response.record);
      await refreshWorkspace();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "提交失败。");
    } finally {
      setIsMutating(false);
    }
  }

  function openActionDrawer(type: GovernanceWorkflowAction) {
    if (!selectedRecord) {
      return;
    }

    setActionType(type);
    actionForm.setFieldsValue({
      businessType: selectedRecord.normalizedFields.businessType,
      entityName: selectedRecord.normalizedFields.entityName,
      ownerName: selectedRecord.normalizedFields.ownerName,
      propertyAddress: selectedRecord.normalizedFields.propertyAddress,
      registrationNo: selectedRecord.normalizedFields.registrationNo,
      riskNote: selectedRecord.normalizedFields.riskNote,
    });
  }

  async function handleWorkflowAction(values: ActionFormValues) {
    if (!actionType || !selectedRecord) {
      return;
    }

    setIsMutating(true);

    try {
      const response = await adminClient.applyGovernanceWorkflowAction(
        selectedRecord.id,
        {
          assigneeUserId: values.assigneeUserId,
          correctedFields:
            actionType === "correct" ? buildFields(values) : undefined,
          reason: values.reason,
          workflowAction: actionType,
        },
      );

      message.success("流程动作已记录。");
      setActionType(null);
      setSelectedRecord(response.record);
      await refreshWorkspace();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "流程处置失败。");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleStartAiJob(processorName: string) {
    if (!selectedRecord) {
      return;
    }

    setIsMutating(true);

    try {
      const response = await adminClient.startGovernanceAiJob(
        selectedRecord.id,
        {
          inputReference: selectedRecord.id,
          processorName,
        },
      );

      message.success("Mock AI 任务已启动。");
      setSelectedRecord(response.record);
      await refreshWorkspace();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "启动失败。");
    } finally {
      setIsMutating(false);
    }
  }

  async function handlePollAiJobs() {
    if (!selectedRecord) {
      return;
    }

    setIsMutating(true);

    try {
      const response = await adminClient.pollGovernanceAiJobs(selectedRecord.id);

      setSelectedRecord(response.record);
      await refreshWorkspace();
      message.success("Mock AI 状态已刷新。");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "刷新失败。");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleStartScenario(bundleKey: string) {
    setIsMutating(true);

    try {
      const response = await adminClient.startGovernanceScenarioRun(bundleKey);

      message.success("场景已启动。");
      setSelectedRecord(response.record);
      setSelectedRecordId(response.record.id);
      await refreshWorkspace();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "场景启动失败。");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleAdvanceScenario(runId: string) {
    setIsMutating(true);

    try {
      const response = await adminClient.advanceGovernanceScenarioRun(runId);

      message.success("场景已推进。");
      setSelectedRecord(response.record);
      setSelectedRecordId(response.record.id);
      await refreshWorkspace();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "场景推进失败。");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleResetScenario(runId: string) {
    setIsMutating(true);

    try {
      await adminClient.resetGovernanceScenarioRun(runId);
      message.success("场景数据已按运行 ID 重置。");
      setSelectedRecord(null);
      setSelectedRecordId(null);
      await refreshWorkspace();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "场景重置失败。");
    } finally {
      setIsMutating(false);
    }
  }

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (queueFilter === "all") {
        return true;
      }

      if (queueFilter === "pending") {
        return Boolean(record.pendingReminder);
      }

      if (queueFilter === "completed") {
        return isCompletedRecord(record);
      }

      if (queueFilter === "correction") {
        return record.status === "manual_correction_required";
      }

      return (
        record.status === "human_review_required" ||
        record.status === "risk_review_required"
      );
    });
  }, [queueFilter, records]);

  const overview = (
    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {[
        ["业务记录", dashboard.records],
        ["上传材料", dashboard.uploads],
        ["审批待办", dashboard.workflowPending],
        ["Mock AI 处理中", dashboard.aiJobsProcessing],
        ["风险预警", dashboard.activeWarnings],
        ["模板", dashboard.templateCount],
      ].map(([label, value]) => (
        <article key={label} className="rounded-md border bg-white p-4">
          <p className="text-sm text-stone-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">{value}</p>
        </article>
      ))}
    </div>
  );

  const columns: TableProps<GovernanceRecordSummary>["columns"] = [
    {
      title: "业务记录",
      key: "title",
      render: (_, record) => (
        <div className="min-w-[220px]">
          <p className="font-semibold text-stone-950">{record.entityName}</p>
          <p className="mt-1 text-sm text-stone-500">{record.businessType}</p>
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: GovernanceRecordSummary["status"]) => (
        <Tag color={statusColors[status]} className="!rounded-full">
          {statusLabels[status]}
        </Tag>
      ),
    },
    {
      title: "来源",
      dataIndex: "sourceType",
      key: "sourceType",
      render: (sourceType: GovernanceSourceType, record) => (
        <div>
          <Tag className="!rounded-full">{sourceTypeLabels[sourceType]}</Tag>
          <p className="mt-1 max-w-[180px] truncate text-xs text-stone-500">
            {record.originalFilename ?? "无源文件"}
          </p>
        </div>
      ),
    },
    {
      title: "Mock 场景",
      dataIndex: "mockScenarioId",
      key: "mockScenarioId",
      render: (scenarioId: string, record) => (
        <div>
          <Tag color="blue" className="!rounded-full">
            {getScenarioLabel(scenarioId)}
          </Tag>
          <p className="mt-1 text-xs text-stone-500">
            {record.mockScenarioSource}
          </p>
        </div>
      ),
    },
    {
      title: "材料/预警",
      key: "counts",
      render: (_, record) => (
        <Space wrap>
          <Tag>{record.uploadCount} 份材料</Tag>
          <Tag color={record.activeWarningCount ? "red" : "green"}>
            {record.activeWarningCount} 条预警
          </Tag>
        </Space>
      ),
    },
    {
      title: "待办提醒",
      dataIndex: "pendingReminder",
      key: "pendingReminder",
      render: (pendingReminder: string | null) =>
        pendingReminder ? (
          <Tag color="gold" className="!rounded-full">
            {pendingReminder}
          </Tag>
        ) : (
          <span className="text-stone-400">无待办</span>
        ),
    },
    {
      title: "最终结果",
      dataIndex: "finalOutcomeStatus",
      key: "finalOutcomeStatus",
      render: (status: string | null) => getOutcomeLabel(status),
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => void openRecordDetail(record.id)}>
            详情
          </Button>
          <Button type="link" onClick={() => openUploadModal(record.id)}>
            上传
          </Button>
        </Space>
      ),
    },
  ];

  const selectedCanAct = selectedRecord && !selectedRecord.finalOutcomeStatus;
  const intakeTitle = intakeSourceType
    ? sourceTypeLabels[intakeSourceType]
    : "创建治理记录";

  return (
    <>
      <AdminPageFrame
        variant="management-list"
        badges={["真实数据流转", "Mock AI 边界", "场景演示"]}
        eyebrow="Governance"
        title="房产与企业治理工作台"
        summary="统一承接业务采集、资料上传、审批流转、Mock AI 处理、数据治理预警和场景模拟。"
        overview={overview}
        operationsTitle="业务采集与场景"
        operationsDescription="新建真实业务记录，或启动带运行 ID 的场景包来演示完整治理流程。"
        operations={
          <Space wrap>
            <Button type="primary" onClick={() => openIntakeModal("manual")}>
              手动录入
            </Button>
            <Button onClick={() => openIntakeModal("docx")}>DOCX 导入</Button>
            <Button onClick={() => openIntakeModal("image")}>图片导入</Button>
            <Button onClick={() => openIntakeModal("excel")}>Excel 导入</Button>
            {scenarioBundles.map((bundle) => (
              <Button
                key={bundle.key}
                loading={isMutating}
                onClick={() => void handleStartScenario(bundle.key)}
              >
                启动{bundle.label}
              </Button>
            ))}
          </Space>
        }
        contentTitle="治理业务"
        contentDescription="按业务记录聚合资料、流程、Mock AI 结果和风险预警。"
        contentBadge={`${filteredRecords.length} 条`}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as GovernanceWorkspaceTabKey)}
          items={[
            {
              key: "records",
              label: "记录",
              children: (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {[
                      ["all", "全部"],
                      ["pending", "全部待办"],
                      ["correction", "待补正"],
                      ["review", "待复核"],
                      ["completed", "已完成"],
                    ].map(([value, label]) => (
                      <Button
                        key={value}
                        type={queueFilter === value ? "primary" : "default"}
                        onClick={() => setQueueFilter(value as typeof queueFilter)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  <Table<GovernanceRecordSummary>
                    rowKey="id"
                    columns={columns}
                    dataSource={filteredRecords}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    scroll={{ x: 1280 }}
                    locale={{ emptyText: "暂无治理记录。" }}
                  />
                </>
              ),
            },
            {
              key: "templates",
              label: "模板与上传",
              children: (
                <Table<GovernanceTemplate>
                  rowKey="key"
                  dataSource={templates}
                  pagination={false}
                  columns={[
                    {
                      title: "模板",
                      key: "template",
                      render: (_, template) => (
                        <div>
                          <p className="font-semibold text-stone-950">
                            {template.label}
                          </p>
                          <p className="text-sm text-stone-500">
                            {template.description}
                          </p>
                        </div>
                      ),
                    },
                    {
                      title: "分类",
                      dataIndex: "category",
                      key: "category",
                      render: (category: string) => <Tag>{category}</Tag>,
                    },
                    {
                      title: "格式",
                      dataIndex: "allowedExtensions",
                      key: "allowedExtensions",
                      render: (items: string[]) => items.join(", "),
                    },
                    {
                      title: "大小",
                      dataIndex: "maxSizeMb",
                      key: "maxSizeMb",
                      render: (value: number) => `${value}MB`,
                    },
                    {
                      title: "操作",
                      key: "actions",
                      render: (_, template) => (
                        <Button
                          type="link"
                          loading={isMutating}
                          onClick={() => void handleTemplateDownload(template.key)}
                        >
                          下载模板
                        </Button>
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              key: "workflow",
              label: "流程待办",
              children: (
                <Table<WorkflowTask>
                  rowKey={(task) => `${task.recordId}:${task.currentNodeName}`}
                  dataSource={workflowTasks}
                  pagination={false}
                  columns={[
                    {
                      title: "业务记录",
                      dataIndex: "recordTitle",
                      key: "recordTitle",
                    },
                    {
                      title: "节点",
                      dataIndex: "currentNodeName",
                      key: "currentNodeName",
                    },
                    {
                      title: "角色",
                      dataIndex: "assigneeRole",
                      key: "assigneeRole",
                    },
                    {
                      title: "提交时间",
                      dataIndex: "createdAt",
                      key: "createdAt",
                    },
                    {
                      title: "操作",
                      key: "actions",
                      render: (_, task) => (
                        <Button
                          type="link"
                          onClick={() => void openRecordDetail(task.recordId)}
                        >
                          处理
                        </Button>
                      ),
                    },
                  ]}
                  locale={{ emptyText: "暂无审批待办。" }}
                />
              ),
            },
            {
              key: "warnings",
              label: "风险预警",
              children: (
                <Table<GovernanceRiskWarning>
                  rowKey="id"
                  dataSource={warnings}
                  pagination={{ pageSize: 8 }}
                  columns={[
                    {
                      title: "级别",
                      dataIndex: "severity",
                      key: "severity",
                      render: (severity: string) => (
                        <Tag color={getSeverityColor(severity)}>{severity}</Tag>
                      ),
                    },
                    {
                      title: "原因",
                      dataIndex: "reason",
                      key: "reason",
                    },
                    {
                      title: "来源",
                      dataIndex: "source",
                      key: "source",
                    },
                    {
                      title: "处置提示",
                      dataIndex: "remediationHint",
                      key: "remediationHint",
                    },
                    {
                      title: "状态",
                      dataIndex: "status",
                      key: "status",
                    },
                  ]}
                  locale={{ emptyText: "暂无风险预警。" }}
                />
              ),
            },
            {
              key: "scenarios",
              label: "场景模拟",
              children: (
                <div className="space-y-5">
                  <Table<ScenarioBundleOption>
                    rowKey="key"
                    dataSource={scenarioBundles}
                    pagination={false}
                    columns={[
                      {
                        title: "智能化测试包",
                        dataIndex: "label",
                        key: "label",
                      },
                      {
                        title: "流程覆盖",
                        dataIndex: "steps",
                        key: "steps",
                        render: (steps: string[]) => steps.join(" -> "),
                      },
                      {
                        title: "操作",
                        key: "actions",
                        render: (_, bundle) => (
                          <Button
                            type="link"
                            loading={isMutating}
                            onClick={() => void handleStartScenario(bundle.key)}
                          >
                            启动测试
                          </Button>
                        ),
                      },
                    ]}
                  />
                  <Table<GovernanceScenarioRun>
                    rowKey="id"
                    dataSource={scenarioRuns}
                    pagination={false}
                    columns={[
                      {
                        title: "场景",
                        dataIndex: "label",
                        key: "label",
                      },
                      {
                        title: "进度",
                        key: "progress",
                        render: (_, run) => (
                          <Progress
                            percent={Math.round(
                              (run.currentStep / run.totalSteps) * 100,
                            )}
                            size="small"
                          />
                        ),
                      },
                      {
                        title: "状态",
                        dataIndex: "status",
                        key: "status",
                        render: (status: string) => <Tag>{status}</Tag>,
                      },
                      {
                        title: "更新时间",
                        dataIndex: "updatedAt",
                        key: "updatedAt",
                      },
                      {
                        title: "操作",
                        key: "actions",
                        render: (_, run) => (
                          <Space>
                            <Button
                              type="link"
                              disabled={run.status !== "running"}
                              onClick={() => void handleAdvanceScenario(run.id)}
                            >
                              推进
                            </Button>
                            <Button
                              type="link"
                              danger
                              disabled={run.status === "reset"}
                              onClick={() => void handleResetScenario(run.id)}
                            >
                              重置
                            </Button>
                          </Space>
                        ),
                      },
                    ]}
                    locale={{ emptyText: "暂无场景运行。" }}
                  />
                </div>
              ),
            },
          ]}
        />
      </AdminPageFrame>

      <Modal
        title={intakeTitle}
        open={Boolean(intakeSourceType)}
        okText="创建"
        cancelText="取消"
        confirmLoading={isMutating}
        onCancel={() => setIntakeSourceType(null)}
        onOk={() => void intakeForm.submit()}
      >
        <Form form={intakeForm} layout="vertical" onFinish={handleCreateIntake}>
          {intakeSourceType !== "manual" ? (
            <Form.Item<IntakeFormValues>
              label="源文件名"
              name="originalFilename"
              rules={[{ required: true, message: "请输入源文件名。" }]}
            >
              <Input placeholder="例如 risk-warning.xlsx" />
            </Form.Item>
          ) : null}
          <Form.Item<IntakeFormValues> label="Mock 场景" name="mockScenarioId">
            <Select
              allowClear
              options={scenarioOptions}
              placeholder="未选择时使用文件名或正常通过"
            />
          </Form.Item>
          {intakeSourceType === "manual" ? (
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Form.Item<IntakeFormValues>
                label="主体名称"
                name="entityName"
                rules={[{ required: true, message: "请输入主体名称。" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item<IntakeFormValues>
                label="业务类型"
                name="businessType"
                rules={[{ required: true, message: "请输入业务类型。" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item<IntakeFormValues> label="权属人" name="ownerName">
                <Input />
              </Form.Item>
              <Form.Item<IntakeFormValues> label="登记编号" name="registrationNo">
                <Input />
              </Form.Item>
              <Form.Item<IntakeFormValues>
                className="sm:col-span-2"
                label="地址"
                name="propertyAddress"
                rules={[{ required: true, message: "请输入地址。" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item<IntakeFormValues>
                className="sm:col-span-2"
                label="风险备注"
                name="riskNote"
              >
                <Input.TextArea rows={2} />
              </Form.Item>
            </div>
          ) : null}
        </Form>
      </Modal>

      <Modal
        title="上传业务材料"
        open={Boolean(uploadRecordId)}
        okText="保存上传元数据"
        cancelText="取消"
        confirmLoading={isMutating}
        onCancel={() => setUploadRecordId(null)}
        onOk={() => void uploadForm.submit()}
      >
        <Form form={uploadForm} layout="vertical" onFinish={handleUpload}>
          <Form.Item<UploadFormValues>
            label="分类"
            name="category"
            rules={[{ required: true, message: "请选择分类。" }]}
          >
            <Select
              options={[
                { label: "DOCX", value: "docx" },
                { label: "图片", value: "image" },
                { label: "Excel", value: "excel" },
              ]}
            />
          </Form.Item>
          <Form.Item<UploadFormValues>
            label="文件名"
            name="fileName"
            rules={[{ required: true, message: "请输入文件名。" }]}
          >
            <Input placeholder="例如 enterprise-governance-register.xlsx" />
          </Form.Item>
          <Form.Item<UploadFormValues>
            label="文件大小"
            name="fileSize"
            rules={[{ required: true, message: "请输入文件大小。" }]}
          >
            <InputNumber className="w-full" min={1} addonAfter="bytes" />
          </Form.Item>
          <Form.Item<UploadFormValues> label="模板" name="templateKey">
            <Select
              allowClear
              options={templates.map((template) => ({
                label: template.label,
                value: template.key,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <DetailDrawerShell
        title={selectedRecord ? selectedRecord.title : "治理记录详情"}
        loading={isDetailLoading}
        open={Boolean(selectedRecordId)}
        onClose={() => {
          setSelectedRecordId(null);
          setSelectedRecord(null);
        }}
      >
        {selectedRecord ? (
          <div className="space-y-5">
            <Space wrap>
              <Tag color={statusColors[selectedRecord.status]}>
                {statusLabels[selectedRecord.status]}
              </Tag>
              <Tag>{sourceTypeLabels[selectedRecord.sourceType]}</Tag>
              <Tag color="blue">
                {getScenarioLabel(selectedRecord.mockScenarioId)}
              </Tag>
              <Tag color={selectedRecord.activeWarningCount ? "red" : "green"}>
                {selectedRecord.activeWarningCount} 条打开预警
              </Tag>
            </Space>

            <Space wrap>
              <Button onClick={() => openUploadModal(selectedRecord.id)}>
                上传材料
              </Button>
              <Button
                loading={isMutating}
                onClick={() => void handleSubmitWorkflow(selectedRecord.id)}
              >
                提交审批
              </Button>
              <Button loading={isMutating} onClick={() => void handlePollAiJobs()}>
                刷新 Mock AI
              </Button>
              {selectedCanAct ? (
                <>
                  <Button onClick={() => openActionDrawer("correct")}>
                    补正
                  </Button>
                  <Button onClick={() => openActionDrawer("approve")}>
                    通过
                  </Button>
                  <Button onClick={() => openActionDrawer("return")}>
                    退回
                  </Button>
                  <Button onClick={() => openActionDrawer("transfer")}>
                    转交
                  </Button>
                  <Button danger onClick={() => openActionDrawer("reject")}>
                    驳回
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => openActionDrawer("archive")}
                  >
                    归档
                  </Button>
                </>
              ) : null}
            </Space>

            <Descriptions
              column={1}
              size="small"
              title="标准化字段"
              items={[
                {
                  key: "entityName",
                  label: "主体名称",
                  children: selectedRecord.normalizedFields.entityName,
                },
                {
                  key: "businessType",
                  label: "业务类型",
                  children: selectedRecord.normalizedFields.businessType,
                },
                {
                  key: "ownerName",
                  label: "权属人",
                  children: selectedRecord.normalizedFields.ownerName,
                },
                {
                  key: "registrationNo",
                  label: "登记编号",
                  children: selectedRecord.normalizedFields.registrationNo,
                },
                {
                  key: "propertyAddress",
                  label: "地址",
                  children: selectedRecord.normalizedFields.propertyAddress,
                },
                {
                  key: "riskNote",
                  label: "风险备注",
                  children: selectedRecord.normalizedFields.riskNote ?? "无",
                },
              ]}
            />

            <Tabs
              items={[
                {
                  key: "uploads",
                  label: "材料",
                  children: (
                    <Table
                      rowKey="id"
                      size="small"
                      pagination={false}
                      dataSource={selectedRecord.uploads}
                      columns={[
                        { title: "文件", dataIndex: "fileName", key: "fileName" },
                        { title: "分类", dataIndex: "category", key: "category" },
                        {
                          title: "校验",
                          dataIndex: "validationStatus",
                          key: "validationStatus",
                          render: (status: string) => <Tag>{status}</Tag>,
                        },
                        {
                          title: "消息",
                          dataIndex: "validationMessages",
                          key: "validationMessages",
                          render: (items: string[]) => items.join("；"),
                        },
                      ]}
                      locale={{ emptyText: "暂无上传材料。" }}
                    />
                  ),
                },
                {
                  key: "ai",
                  label: "Mock AI",
                  children: (
                    <div className="space-y-4">
                      <Space wrap>
                        {initialProcessors.map((processor) => (
                          <Button
                            key={processor.name}
                            loading={isMutating}
                            onClick={() => void handleStartAiJob(processor.name)}
                          >
                            {processor.name}
                          </Button>
                        ))}
                      </Space>
                      <Table
                        rowKey="name"
                        size="small"
                        pagination={false}
                        dataSource={initialProcessors}
                        columns={[
                          {
                            title: "智能处理器",
                            dataIndex: "name",
                            key: "name",
                          },
                          {
                            title: "智能化展示",
                            dataIndex: "description",
                            key: "description",
                          },
                          {
                            title: "确定性输出",
                            dataIndex: "outputSummary",
                            key: "outputSummary",
                          },
                          {
                            title: "风险指标",
                            dataIndex: "riskIndicators",
                            key: "riskIndicators",
                            render: (items: string[]) =>
                              items.length ? items.join(", ") : "无",
                          },
                        ]}
                      />
                      <Table
                        rowKey="id"
                        size="small"
                        pagination={false}
                        dataSource={selectedRecord.aiJobs}
                        columns={[
                          {
                            title: "处理器",
                            dataIndex: "processorName",
                            key: "processorName",
                          },
                          {
                            title: "状态",
                            dataIndex: "status",
                            key: "status",
                            render: (status: string) => <Tag>{status}</Tag>,
                          },
                          {
                            title: "摘要",
                            dataIndex: "outputSummary",
                            key: "outputSummary",
                            render: (value: string | null) => value ?? "处理中",
                          },
                          {
                            title: "来源",
                            dataIndex: "mockSource",
                            key: "mockSource",
                          },
                        ]}
                        locale={{ emptyText: "暂无 Mock AI 任务。" }}
                      />
                    </div>
                  ),
                },
                {
                  key: "warnings",
                  label: "预警",
                  children: (
                    <Table
                      rowKey="id"
                      size="small"
                      pagination={false}
                      dataSource={selectedRecord.riskWarnings}
                      columns={[
                        {
                          title: "级别",
                          dataIndex: "severity",
                          key: "severity",
                          render: (severity: string) => (
                            <Tag color={getSeverityColor(severity)}>
                              {severity}
                            </Tag>
                          ),
                        },
                        { title: "原因", dataIndex: "reason", key: "reason" },
                        { title: "来源", dataIndex: "source", key: "source" },
                        {
                          title: "处置提示",
                          dataIndex: "remediationHint",
                          key: "remediationHint",
                        },
                      ]}
                      locale={{ emptyText: "暂无风险预警。" }}
                    />
                  ),
                },
                {
                  key: "workflow",
                  label: "流程",
                  children: (
                    <Timeline
                      items={selectedRecord.workflowEvents.map((event) => ({
                        children: (
                          <div>
                            <p className="font-semibold text-stone-950">
                              {event.action} / {event.result}
                            </p>
                            <p className="text-sm text-stone-600">
                              {event.summary}
                            </p>
                            <p className="text-xs text-stone-400">
                              {event.createdAt} · {event.actorDisplayName}
                              {event.reason ? ` · ${event.reason}` : ""}
                            </p>
                          </div>
                        ),
                      }))}
                    />
                  ),
                },
              ]}
            />
          </div>
        ) : null}
      </DetailDrawerShell>

      <Drawer
        title={
          actionType === "correct"
            ? "人工补正"
            : actionType === "approve"
              ? "审批通过"
              : actionType === "reject"
                ? "驳回记录"
                : actionType === "return"
                  ? "退回补正"
                  : actionType === "transfer"
                    ? "转交流程"
                    : "归档记录"
        }
        open={Boolean(actionType)}
        size="large"
        onClose={() => setActionType(null)}
        extra={
          <Button
            type="primary"
            loading={isMutating}
            onClick={() => void actionForm.submit()}
          >
            提交
          </Button>
        }
      >
        <Form form={actionForm} layout="vertical" onFinish={handleWorkflowAction}>
          {actionType === "correct" ? (
            <>
              <Form.Item<ActionFormValues> label="主体名称" name="entityName">
                <Input />
              </Form.Item>
              <Form.Item<ActionFormValues> label="业务类型" name="businessType">
                <Input />
              </Form.Item>
              <Form.Item<ActionFormValues> label="权属人" name="ownerName">
                <Input />
              </Form.Item>
              <Form.Item<ActionFormValues> label="登记编号" name="registrationNo">
                <Input />
              </Form.Item>
              <Form.Item<ActionFormValues> label="地址" name="propertyAddress">
                <Input />
              </Form.Item>
              <Form.Item<ActionFormValues> label="风险备注" name="riskNote">
                <Input.TextArea rows={2} />
              </Form.Item>
            </>
          ) : null}
          {actionType === "transfer" ? (
            <Form.Item<ActionFormValues> label="指定处理人 ID" name="assigneeUserId">
              <Input placeholder="留空则转回角色队列" />
            </Form.Item>
          ) : null}
          <Form.Item<ActionFormValues>
            label="意见"
            name="reason"
            rules={[
              {
                required: actionType === "reject" || actionType === "return",
                message: "请输入审批意见。",
              },
            ]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
