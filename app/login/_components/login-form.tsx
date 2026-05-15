"use client";

import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  Space,
  Tag,
  Typography,
} from "antd";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { adminClient } from "@/lib/admin/client";
import { adminRoutes } from "@/lib/admin/routes";

type LoginFormProps = {
  developmentPasswordHint: string | null;
};

type LoginFormValues = Parameters<typeof adminClient.login>[0];

export function LoginForm({ developmentPasswordHint }: LoginFormProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<LoginFormValues>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const data = await adminClient.login(values);

      message.success(`已登录 ${data?.user?.username ?? values.username}`);
      startTransition(() => {
        router.replace(adminRoutes.home);
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "登录失败，请稍后重试。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="login-panel" variant="borderless">
      <Space orientation="vertical" size={18} className="full-width">
        <div>
          <Typography.Title level={3} className="login-title">
            用户登录
          </Typography.Title>
          <Typography.Text type="secondary">
            使用管理员账号进入当前业务管理后台
          </Typography.Text>
        </div>

        {developmentPasswordHint ? (
          <div className="login-credential-tags" aria-label="开发环境默认账号">
            <Tag color="blue">账号 root</Tag>
            <Tag color="green">密码 {developmentPasswordHint}</Tag>
          </div>
        ) : null}

        {errorMessage ? (
          <Alert
            type="error"
            showIcon
            title="登录失败"
            description={errorMessage}
          />
        ) : null}

        <Form<LoginFormValues>
          form={form}
          layout="vertical"
          initialValues={{
            username: "root",
          }}
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            label="账号名"
            name="username"
            rules={[{ required: true, message: "请输入账号名" }]}
          >
            <Input autoComplete="username" placeholder="root" size="large" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password
              autoComplete="current-password"
              placeholder="请输入后台账号密码"
              size="large"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            block
            size="large"
          >
            登录管理后台
          </Button>
        </Form>
      </Space>
    </Card>
  );
}
