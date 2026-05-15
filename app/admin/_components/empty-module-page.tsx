import { Empty } from "antd";

import { AdminPageFrame } from "@/app/admin/_components/admin-page-frame";

type EmptyModulePageProps = {
  moduleName: string;
};

export function EmptyModulePage({ moduleName }: EmptyModulePageProps) {
  return (
    <AdminPageFrame
      badges={["待定义"]}
      eyebrow="Module Placeholder"
      title={moduleName}
      summary="该模块已预留入口，具体流程和数据结构会根据后续需求补齐。"
      operationsTitle="模块配置"
      operationsDescription="当前阶段不开放操作。"
      operations={<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      contentTitle="业务内容"
      contentDescription="等待详细需求后接入页面、API 和数据模型。"
    >
      <Empty description="暂无内容" image={Empty.PRESENTED_IMAGE_SIMPLE} />
    </AdminPageFrame>
  );
}
