"use client";

import type { TableProps } from "antd";
import {
  App,
  Button,
  Descriptions,
  Form,
  Input,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
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
  type AdminRoleKey,
  type AdminUser,
  builtInRoles,
  getAdminRoleColor,
  getAdminUserStatusLabel,
  getRoleByKey,
} from "@/lib/admin/system-data";

const userPageSizeOptions = [10, 20, 30, 40, 50];
const filterGridStyle = {
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
} as const;

type UserFilterFormValues = {
  createdDateEnd?: string;
  createdDateStart?: string;
  displayName?: string;
  roleKey?: AdminRoleKey;
  status?: AdminUser["status"];
  username?: string;
};

type UserManagementPageProps = {
  initialUsers: AdminUser[];
};

export function UserManagementPage({ initialUsers }: UserManagementPageProps) {
  const { message } = App.useApp();
  const [filterForm] = Form.useForm<UserFilterFormValues>();
  const { isPending: isTablePending, runDeferred } = useDeferredTablePending();
  const [users, setUsers] = useState(initialUsers);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<UserFilterFormValues>(
    {},
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(userPageSizeOptions[0]);
  const {
    closeResource: closeUserDetail,
    isLoading: isUserDetailLoading,
    openResource: openUserDetail,
    resource: selectedUser,
    resourceId: selectedUserId,
  } = useDetailResource(
    async (userId: string) => {
      const response = await adminClient.getUserDetail(userId);

      return response.user;
    },
    {
      onOpenError: (error) => {
        message.error(
          error instanceof Error ? error.message : "读取用户详情失败。",
        );
      },
    },
  );

  async function refreshPageData(showLoading = false) {
    if (showLoading) {
      setIsLoading(true);
    }

    setPageError(null);

    try {
      const usersResponse = await adminClient.listUsers();

      setUsers(usersResponse.users);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "加载用户数据失败。",
      );
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }

  async function handleDeleteUser(user: AdminUser) {
    try {
      await adminClient.deleteUser(user.id);

      if (selectedUserId === user.id) {
        closeUserDetail();
      }

      message.success(`已删除用户 ${user.username}`);
      await refreshPageData();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "删除用户失败。");
    }
  }

  function handleApplyFilters(values: UserFilterFormValues) {
    const nextFilters = normalizeDateRangeFilters(
      {
        createdDateEnd: values.createdDateEnd,
        createdDateStart: values.createdDateStart,
        displayName: normalizeOptionalFilterValue(values.displayName),
        roleKey: values.roleKey || undefined,
        status: values.status || undefined,
        username: normalizeOptionalFilterValue(values.username),
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

  const filteredUsers = users.filter((user) => {
    if (!matchesTextFilter(user.username, appliedFilters.username)) {
      return false;
    }

    if (!matchesTextFilter(user.displayName, appliedFilters.displayName)) {
      return false;
    }

    if (appliedFilters.roleKey && user.roleKey !== appliedFilters.roleKey) {
      return false;
    }

    if (appliedFilters.status && user.status !== appliedFilters.status) {
      return false;
    }

    const createdDate = user.createdAt.slice(0, 10);

    if (
      appliedFilters.createdDateStart &&
      createdDate < appliedFilters.createdDateStart
    ) {
      return false;
    }

    if (
      appliedFilters.createdDateEnd &&
      createdDate > appliedFilters.createdDateEnd
    ) {
      return false;
    }

    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const effectiveCurrentPage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice(
    (effectiveCurrentPage - 1) * pageSize,
    effectiveCurrentPage * pageSize,
  );
  const roleOptions = builtInRoles.map((role) => ({
    label: role.label,
    value: role.key,
  }));
  const statusOptions = (["system", "active"] as const).map((status) => ({
    label: getAdminUserStatusLabel(status),
    value: status,
  }));

  const columns: TableProps<AdminUser>["columns"] = [
    {
      title: "账号",
      dataIndex: "username",
      key: "username",
      render: (_, record) => (
        <div>
          <p className="font-semibold text-stone-950">{record.username}</p>
          <p className="mt-1 text-sm text-stone-500">{record.displayName}</p>
        </div>
      ),
    },
    {
      title: "角色",
      dataIndex: "roleKey",
      key: "roleKey",
      render: (value: AdminRoleKey) => (
        <Tag color={getAdminRoleColor(value)} className="!rounded-full">
          {value}
        </Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "statusLabel",
      key: "statusLabel",
      render: (value: AdminUser["statusLabel"]) => (
        <Tag className="!rounded-full">{value}</Tag>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
    },
    {
      title: "操作",
      key: "actions",
      render: (_, record) => (
        <Space wrap size="small">
          <Button type="link" onClick={() => void openUserDetail(record.id)}>
            查看详情
          </Button>

          {record.isProtected ? (
            <Tooltip title="root 账号为系统保留账号，当前不支持删除。">
              <span>
                <Button danger disabled>
                  删除
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Popconfirm
              title={`删除用户 ${record.username}`}
              description="此操作会从 Turso 数据库中删除该账号。"
              okText="确认删除"
              cancelText="取消"
              onConfirm={() => void handleDeleteUser(record)}
            >
              <Button danger>删除</Button>
            </Popconfirm>
          )}
        </Space>
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
              <Form.Item<UserFilterFormValues>
                className="!mb-0"
                label="登录账号"
                name="username"
              >
                <Input allowClear placeholder="输入账号名" />
              </Form.Item>

              <Form.Item<UserFilterFormValues>
                className="!mb-0"
                label="显示名称"
                name="displayName"
              >
                <Input allowClear placeholder="输入显示名称" />
              </Form.Item>

              <Form.Item<UserFilterFormValues>
                className="!mb-0"
                label="角色"
                name="roleKey"
              >
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="全部角色"
                  options={roleOptions}
                />
              </Form.Item>

              <Form.Item<UserFilterFormValues>
                className="!mb-0"
                label="状态"
                name="status"
              >
                <Select
                  allowClear
                  placeholder="全部状态"
                  options={statusOptions}
                />
              </Form.Item>

              <Form.Item<UserFilterFormValues>
                className="!mb-0"
                label="开始日期"
                name="createdDateStart"
              >
                <Input type="date" />
              </Form.Item>

              <Form.Item<UserFilterFormValues>
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
              total={filteredUsers.length}
              showSizeChanger
              pageSizeOptions={userPageSizeOptions.map(String)}
              onChange={handlePaginationChange}
              onShowSizeChange={handlePaginationChange}
            />
          }
          totalItems={filteredUsers.length}
          totalLabel="个账号"
        >
          <Table<AdminUser>
            rowKey="id"
            columns={columns}
            dataSource={paginatedUsers}
            pagination={false}
            loading={isLoading || isTablePending}
            scroll={{ x: 760 }}
            locale={{
              emptyText: pageError
                ? "当前无法展示账号列表。"
                : hasActiveFilterValues(appliedFilters)
                  ? "没有匹配当前筛选条件的账号。"
                  : "暂无可展示账号。",
            }}
          />
        </ManagementListContent>
      </AdminPageFrame>

      <DetailDrawerShell
        title={selectedUser ? `${selectedUser.username} 详情` : "用户详情"}
        loading={isUserDetailLoading}
        open={Boolean(selectedUserId)}
        onClose={closeUserDetail}
      >
        {selectedUser ? (
          <div className="space-y-4">
            <Descriptions
              column={1}
              size="small"
              items={[
                {
                  key: "username",
                  label: "账号名",
                  children: selectedUser.username,
                },
                {
                  key: "displayName",
                  label: "显示名称",
                  children: selectedUser.displayName,
                },
                {
                  key: "roleKey",
                  label: "角色",
                  children: (
                    <Tag
                      color={getAdminRoleColor(selectedUser.roleKey)}
                      className="!rounded-full"
                    >
                      {selectedUser.roleKey}
                    </Tag>
                  ),
                },
                {
                  key: "status",
                  label: "状态",
                  children: selectedUser.statusLabel,
                },
                {
                  key: "createdAt",
                  label: "创建时间",
                  children: selectedUser.createdAt,
                },
                {
                  key: "lastLoginAt",
                  label: "最近登录",
                  children: selectedUser.lastLoginAt ?? "尚未登录",
                },
              ]}
            />

            <Descriptions
              column={1}
              size="small"
              items={[
                {
                  key: "accountType",
                  label: "账号类型",
                  children: selectedUser.isProtected
                    ? "系统保留账号"
                    : "普通后台账号",
                },
              ]}
            />

            <section className="rounded-[22px] border border-stone-200/80 bg-stone-50/90 p-4">
              <p className="text-sm font-semibold text-stone-950">角色说明</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                {getRoleByKey(selectedUser.roleKey).summary}
              </p>
            </section>
          </div>
        ) : null}
      </DetailDrawerShell>
    </>
  );
}
