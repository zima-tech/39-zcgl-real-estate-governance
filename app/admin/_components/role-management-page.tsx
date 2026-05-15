"use client";

import type { TableProps } from "antd";
import {
  App,
  Button,
  Descriptions,
  Form,
  Input,
  Pagination,
  Select,
  Table,
  Tag,
} from "antd";
import { useState } from "react";

import { AdminPageFrame } from "@/app/admin/_components/admin-page-frame";
import { DetailDrawerShell } from "@/app/admin/_components/shared/detail-drawer-shell";
import { FilterActionButtons } from "@/app/admin/_components/shared/filter-action-buttons";
import { ManagementListContent } from "@/app/admin/_components/shared/management-list-content";
import {
  hasActiveFilterValues,
  matchesTextFilter,
  normalizeDateRangeFilters,
  normalizeOptionalFilterValue,
} from "@/app/admin/_hooks/admin-filters";
import { useDeferredTablePending } from "@/app/admin/_hooks/use-deferred-table-pending";
import { useDetailResource } from "@/app/admin/_hooks/use-detail-resource";
import { adminClient } from "@/lib/admin/client";
import {
  type AdminRole,
  type AdminRoleKey,
  getAdminRoleColor,
} from "@/lib/admin/system-data";

const rolePageSizeOptions = [10, 20, 30, 40, 50];
const filterGridStyle = {
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
} as const;

type RoleFilterFormValues = {
  createdDateEnd?: string;
  createdDateStart?: string;
  permissionScope?: string;
  roleLabel?: string;
  roleKey?: AdminRoleKey;
  summary?: string;
};

type RoleManagementPageProps = {
  initialRoles: AdminRole[];
};

export function RoleManagementPage({ initialRoles }: RoleManagementPageProps) {
  const { message } = App.useApp();
  const [filterForm] = Form.useForm<RoleFilterFormValues>();
  const { isPending: isTablePending, runDeferred } = useDeferredTablePending();
  const [roles] = useState(initialRoles);
  const [pageError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<RoleFilterFormValues>(
    {},
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(rolePageSizeOptions[0]);
  const {
    closeResource: closeRoleDetail,
    isLoading: isRoleDetailLoading,
    openResource: openRoleDetail,
    resource: selectedRole,
    resourceId: selectedRoleKey,
  } = useDetailResource(
    async (roleKey: string) => {
      const response = await adminClient.getRoleDetail(roleKey);

      return response.role;
    },
    {
      onOpenError: (error) => {
        message.error(
          error instanceof Error ? error.message : "读取角色详情失败。",
        );
      },
    },
  );

  function handleApplyFilters(values: RoleFilterFormValues) {
    const nextFilters = normalizeDateRangeFilters(
      {
        createdDateEnd: values.createdDateEnd,
        createdDateStart: values.createdDateStart,
        permissionScope: normalizeOptionalFilterValue(values.permissionScope),
        roleLabel: normalizeOptionalFilterValue(values.roleLabel),
        roleKey: values.roleKey || undefined,
        summary: normalizeOptionalFilterValue(values.summary),
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

    runDeferred(() => {
      setAppliedFilters(nextFilters);
      setCurrentPage(1);
    });
  }

  function handleResetFilters() {
    filterForm.resetFields();
    runDeferred(() => {
      setAppliedFilters({});
      setCurrentPage(1);
    });
  }

  function handlePaginationChange(nextPage: number, nextPageSize: number) {
    runDeferred(() => {
      setCurrentPage(nextPage);
      setPageSize(nextPageSize);
    });
  }

  const filteredRoles = roles.filter((role) => {
    if (!matchesTextFilter(role.label, appliedFilters.roleLabel)) {
      return false;
    }

    if (!matchesTextFilter(role.summary, appliedFilters.summary)) {
      return false;
    }

    if (appliedFilters.roleKey && role.key !== appliedFilters.roleKey) {
      return false;
    }

    if (
      appliedFilters.permissionScope &&
      !role.permissionScope.includes(appliedFilters.permissionScope)
    ) {
      return false;
    }

    const createdDate = role.createdAt?.slice(0, 10);

    if (
      (appliedFilters.createdDateStart || appliedFilters.createdDateEnd) &&
      !createdDate
    ) {
      return false;
    }

    if (
      appliedFilters.createdDateStart &&
      createdDate &&
      createdDate < appliedFilters.createdDateStart
    ) {
      return false;
    }

    if (
      appliedFilters.createdDateEnd &&
      createdDate &&
      createdDate > appliedFilters.createdDateEnd
    ) {
      return false;
    }

    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / pageSize));
  const effectiveCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRoles = filteredRoles.slice(
    (effectiveCurrentPage - 1) * pageSize,
    effectiveCurrentPage * pageSize,
  );
  const roleOptions = roles.map((role) => ({
    label: role.label,
    value: role.key,
  }));
  const permissionScopeOptions = Array.from(
    new Set(roles.flatMap((role) => role.permissionScope)),
  ).map((item) => ({
    label: item,
    value: item,
  }));

  const columns: TableProps<AdminRole>["columns"] = [
    {
      title: "角色",
      dataIndex: "label",
      key: "label",
      render: (_, role) => (
        <div>
          <div className="flex items-center gap-3">
            <p className="font-semibold text-stone-950">{role.label}</p>
            <Tag color={getAdminRoleColor(role.key)} className="!rounded-full">
              内置
            </Tag>
          </div>
          <p className="mt-1 text-sm text-stone-500">{role.summary}</p>
        </div>
      ),
    },
    {
      title: "权限范围摘要",
      dataIndex: "permissionScope",
      key: "permissionScope",
      render: (permissionScope: string[]) => permissionScope[0],
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: AdminRole["createdAt"]) => value ?? "--",
    },
    {
      title: "当前账号数",
      dataIndex: "memberCount",
      key: "memberCount",
    },
    {
      title: "操作",
      key: "actions",
      render: (_, role) => (
        <Button type="link" onClick={() => void openRoleDetail(role.key)}>
          查看权限范围
        </Button>
      ),
    },
  ];

  return (
    <>
      <AdminPageFrame
        variant="management-list"
        badges={[]}
        eyebrow=""
        title=""
        summary=""
        operationsTitle=""
        operationsDescription=""
        operations={
          <Form
            form={filterForm}
            layout="vertical"
            onFinish={handleApplyFilters}
          >
            <div className="grid items-end gap-4 pb-2" style={filterGridStyle}>
              <Form.Item<RoleFilterFormValues>
                className="!mb-0"
                label="角色名称"
                name="roleLabel"
              >
                <Input allowClear placeholder="输入角色名称" />
              </Form.Item>

              <Form.Item<RoleFilterFormValues>
                className="!mb-0"
                label="角色摘要"
                name="summary"
              >
                <Input allowClear placeholder="输入角色摘要" />
              </Form.Item>

              <Form.Item<RoleFilterFormValues>
                className="!mb-0"
                label="角色标识"
                name="roleKey"
              >
                <Select
                  allowClear
                  placeholder="全部角色"
                  options={roleOptions}
                />
              </Form.Item>

              <Form.Item<RoleFilterFormValues>
                className="!mb-0"
                label="权限范围"
                name="permissionScope"
              >
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="全部权限范围"
                  options={permissionScopeOptions}
                />
              </Form.Item>

              <Form.Item<RoleFilterFormValues>
                className="!mb-0"
                label="开始日期"
                name="createdDateStart"
              >
                <Input type="date" />
              </Form.Item>

              <Form.Item<RoleFilterFormValues>
                className="!mb-0"
                label="结束日期"
                name="createdDateEnd"
              >
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
          pageError={pageError}
          pageSize={pageSize}
          pagination={
            <Pagination
              current={effectiveCurrentPage}
              pageSize={pageSize}
              total={filteredRoles.length}
              showSizeChanger
              pageSizeOptions={rolePageSizeOptions.map(String)}
              onChange={handlePaginationChange}
              onShowSizeChange={handlePaginationChange}
            />
          }
          totalItems={filteredRoles.length}
          totalLabel="个角色"
        >
          <Table<AdminRole>
            rowKey="key"
            columns={columns}
            dataSource={paginatedRoles}
            pagination={false}
            loading={isTablePending}
            scroll={{ x: 760 }}
            locale={{
              emptyText: hasActiveFilterValues(appliedFilters)
                ? "没有匹配当前筛选条件的角色。"
                : "暂无可展示角色。",
            }}
          />
        </ManagementListContent>
      </AdminPageFrame>

      <DetailDrawerShell
        title={selectedRole ? `${selectedRole.label} 权限范围` : "角色详情"}
        loading={isRoleDetailLoading}
        open={Boolean(selectedRoleKey)}
        onClose={closeRoleDetail}
      >
        {selectedRole ? (
          <div className="space-y-4">
            <Descriptions
              column={1}
              size="small"
              items={[
                {
                  key: "label",
                  label: "角色名",
                  children: (
                    <Tag
                      color={getAdminRoleColor(selectedRole.key)}
                      className="!rounded-full"
                    >
                      {selectedRole.label}
                    </Tag>
                  ),
                },
                {
                  key: "summary",
                  label: "角色摘要",
                  children: selectedRole.summary,
                },
                {
                  key: "memberCount",
                  label: "当前账号数",
                  children: selectedRole.memberCount ?? 0,
                },
                {
                  key: "createdAt",
                  label: "创建时间",
                  children: selectedRole.createdAt ?? "--",
                },
                {
                  key: "updatedAt",
                  label: "更新时间",
                  children: selectedRole.updatedAt ?? "--",
                },
              ]}
            />

            <section className="rounded-[22px] border border-stone-200/80 bg-stone-50/90 p-4">
              <p className="text-sm font-semibold text-stone-950">权限范围</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-600">
                {selectedRole.permissionScope.map((item) => (
                  <li key={item} className="rounded-[16px] bg-white px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <Descriptions
              column={1}
              size="small"
              items={[
                {
                  key: "protectionNote",
                  label: "保护说明",
                  children: selectedRole.protectionNote,
                },
              ]}
            />
          </div>
        ) : null}
      </DetailDrawerShell>
    </>
  );
}
