"use client";

import type { TableProps } from "antd";
import { Form, Input, Pagination, Select, Space, Table, Tag } from "antd";
import { useMemo, useState } from "react";

import { AdminPageFrame } from "@/app/admin/_components/admin-page-frame";
import { FilterActionButtons } from "@/app/admin/_components/shared/filter-action-buttons";
import { ManagementListContent } from "@/app/admin/_components/shared/management-list-content";
import {
  hasActiveFilterValues,
  matchesTextFilter,
  normalizeDateRangeFilters,
  normalizeOptionalFilterValue,
} from "@/app/admin/_hooks/admin-filters";
import type { AdminAuditLog } from "@/lib/admin/audit-log";

type AuditLogsPageProps = {
  initialLogs: AdminAuditLog[];
};

type AuditLogFilterValues = {
  actor?: string;
  action?: string;
  actorUsername?: string;
  createdDateEnd?: string;
  createdDateStart?: string;
  module?: string;
  requestPath?: string;
  summary?: string;
  targetName?: string;
  targetType?: string;
};

const resultColor: Record<AdminAuditLog["result"], string> = {
  failure: "red",
  success: "green",
};
const filterGridStyle = {
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
} as const;
const auditLogPageSizeOptions = [10, 20, 30, 40, 50];

export function AuditLogsPage({ initialLogs }: AuditLogsPageProps) {
  const [filterForm] = Form.useForm<AuditLogFilterValues>();
  const [filters, setFilters] = useState<AuditLogFilterValues>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(auditLogPageSizeOptions[0]);
  const modules = useMemo(
    () => Array.from(new Set(initialLogs.map((log) => log.module))),
    [initialLogs],
  );
  const actors = useMemo(
    () => Array.from(new Set(initialLogs.map((log) => log.actorDisplayName))),
    [initialLogs],
  );
  const filteredLogs = useMemo(() => {
    return initialLogs.filter((log) => {
      const moduleMatched = !filters.module || log.module === filters.module;
      const actorMatched =
        !filters.actor || log.actorDisplayName === filters.actor;
      const actionMatched = matchesTextFilter(log.action, filters.action);
      const actorUsernameMatched = matchesTextFilter(
        log.actorUsername,
        filters.actorUsername,
      );
      const targetNameMatched = matchesTextFilter(
        log.targetName,
        filters.targetName,
      );
      const targetTypeMatched = matchesTextFilter(
        log.targetType,
        filters.targetType,
      );
      const summaryMatched = matchesTextFilter(log.summary, filters.summary);
      const requestPathMatched = matchesTextFilter(
        log.requestPath,
        filters.requestPath,
      );
      const createdDate = log.createdAt.slice(0, 10);
      const createdDateMatched =
        (!filters.createdDateStart ||
          createdDate >= filters.createdDateStart) &&
        (!filters.createdDateEnd || createdDate <= filters.createdDateEnd);

      return (
        moduleMatched &&
        actorMatched &&
        actionMatched &&
        actorUsernameMatched &&
        targetNameMatched &&
        targetTypeMatched &&
        summaryMatched &&
        requestPathMatched &&
        createdDateMatched
      );
    });
  }, [filters, initialLogs]);
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const effectiveCurrentPage = Math.min(currentPage, totalPages);
  const paginatedLogs = filteredLogs.slice(
    (effectiveCurrentPage - 1) * pageSize,
    effectiveCurrentPage * pageSize,
  );
  const columns: TableProps<AdminAuditLog>["columns"] = [
    {
      title: "操作日期",
      dataIndex: "createdAt",
      width: 180,
    },
    {
      title: "模块",
      dataIndex: "module",
      width: 120,
      render: (value: string) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "操作",
      dataIndex: "action",
      width: 150,
    },
    {
      title: "操作人",
      dataIndex: "actorDisplayName",
      width: 180,
      render: (_value: string, record) => (
        <Space orientation="vertical" size={0}>
          <span>{record.actorDisplayName}</span>
          <span className="text-xs text-[#6b7280]">
            {record.actorUsername} / {record.actorRoleKey}
          </span>
        </Space>
      ),
    },
    {
      title: "对象",
      dataIndex: "targetName",
      width: 220,
      render: (_value: string | null, record) => (
        <Space orientation="vertical" size={0}>
          <span>{record.targetName ?? record.targetId ?? "无指定对象"}</span>
          <span className="text-xs text-[#6b7280]">{record.targetType}</span>
        </Space>
      ),
    },
    {
      title: "结果",
      dataIndex: "result",
      width: 100,
      render: (value: AdminAuditLog["result"]) => (
        <Tag color={resultColor[value]}>
          {value === "success" ? "成功" : "失败"}
        </Tag>
      ),
    },
    {
      title: "摘要",
      dataIndex: "summary",
      width: 320,
    },
    {
      title: "请求",
      dataIndex: "requestPath",
      width: 260,
      render: (_value: string | null, record) => (
        <Space orientation="vertical" size={0}>
          <span>{record.requestPath ?? "-"}</span>
          <span className="text-xs text-[#6b7280]">
            {record.requestMethod ?? "-"}
          </span>
        </Space>
      ),
    },
  ];
  function handleApplyFilters(values: AuditLogFilterValues) {
    const nextFilters = normalizeDateRangeFilters(
      {
        action: normalizeOptionalFilterValue(values.action),
        actor: values.actor || undefined,
        actorUsername: normalizeOptionalFilterValue(values.actorUsername),
        createdDateEnd: values.createdDateEnd,
        createdDateStart: values.createdDateStart,
        module: values.module || undefined,
        requestPath: normalizeOptionalFilterValue(values.requestPath),
        summary: normalizeOptionalFilterValue(values.summary),
        targetName: normalizeOptionalFilterValue(values.targetName),
        targetType: normalizeOptionalFilterValue(values.targetType),
      },
      "createdDateStart",
      "createdDateEnd",
    );

    if (
      nextFilters.createdDateStart !== values.createdDateStart ||
      nextFilters.createdDateEnd !== values.createdDateEnd
    ) {
      filterForm.setFieldsValue({
        createdDateEnd: nextFilters.createdDateEnd,
        createdDateStart: nextFilters.createdDateStart,
      });
    }

    setFilters(nextFilters);
    setCurrentPage(1);
  }

  function handleResetFilters() {
    filterForm.resetFields();
    setFilters({});
    setCurrentPage(1);
  }

  function handlePaginationChange(nextPage: number, nextPageSize: number) {
    setCurrentPage(nextPage);
    setPageSize(nextPageSize);
  }

  return (
    <AdminPageFrame
      variant="management-list"
      eyebrow=""
      title=""
      summary=""
      operationsTitle=""
      operationsDescription=""
      operations={
        <Form form={filterForm} layout="vertical" onFinish={handleApplyFilters}>
          <div className="grid items-end gap-4 pb-2" style={filterGridStyle}>
            <Form.Item className="!mb-0" name="action" label="操作">
              <Input allowClear placeholder="输入操作" />
            </Form.Item>
            <Form.Item className="!mb-0" name="module" label="模块">
              <Select
                allowClear
                placeholder="全部模块"
                options={modules.map((moduleName) => ({
                  label: moduleName,
                  value: moduleName,
                }))}
              />
            </Form.Item>
            <Form.Item className="!mb-0" name="actor" label="操作人">
              <Select
                allowClear
                placeholder="全部操作人"
                options={actors.map((actorName) => ({
                  label: actorName,
                  value: actorName,
                }))}
              />
            </Form.Item>
            <Form.Item className="!mb-0" name="actorUsername" label="操作账号">
              <Input allowClear placeholder="输入操作账号" />
            </Form.Item>
            <Form.Item className="!mb-0" name="targetName" label="对象名称">
              <Input allowClear placeholder="输入对象名称" />
            </Form.Item>
            <Form.Item className="!mb-0" name="targetType" label="对象类型">
              <Input allowClear placeholder="输入对象类型" />
            </Form.Item>
            <Form.Item className="!mb-0" name="summary" label="摘要">
              <Input allowClear placeholder="输入摘要" />
            </Form.Item>
            <Form.Item className="!mb-0" name="requestPath" label="请求路径">
              <Input allowClear placeholder="输入请求路径" />
            </Form.Item>
            <Form.Item
              className="!mb-0"
              name="createdDateStart"
              label="开始日期"
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item className="!mb-0" name="createdDateEnd" label="结束日期">
              <Input type="date" />
            </Form.Item>
            <FilterActionButtons onReset={handleResetFilters} />
          </div>
        </Form>
      }
      contentTitle=""
      contentDescription=""
      contentBadge=""
    >
      <ManagementListContent
        currentPage={effectiveCurrentPage}
        pageError={null}
        pageSize={pageSize}
        pagination={
          <Pagination
            current={effectiveCurrentPage}
            pageSize={pageSize}
            total={filteredLogs.length}
            showSizeChanger
            pageSizeOptions={auditLogPageSizeOptions.map(String)}
            onChange={handlePaginationChange}
            onShowSizeChange={handlePaginationChange}
          />
        }
        totalItems={filteredLogs.length}
        totalLabel="条日志"
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={paginatedLogs}
          scroll={{ x: 1380 }}
          pagination={false}
          locale={{
            emptyText: hasActiveFilterValues(filters)
              ? "没有匹配当前筛选条件的审计日志。"
              : "暂无审计日志。",
          }}
        />
      </ManagementListContent>
    </AdminPageFrame>
  );
}
