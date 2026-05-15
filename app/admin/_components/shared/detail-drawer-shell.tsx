import { Drawer, Skeleton } from "antd";

type DetailDrawerShellProps = {
  children: React.ReactNode;
  loading: boolean;
  onClose: () => void;
  open: boolean;
  size?: number;
  title: string;
};

export function DetailDrawerShell({
  children,
  loading,
  onClose,
  open,
  size = 420,
  title,
}: DetailDrawerShellProps) {
  return (
    <Drawer
      title={title}
      placement="right"
      size={size}
      open={open}
      onClose={onClose}
    >
      {loading ? <Skeleton active paragraph={{ rows: 8 }} /> : children}
    </Drawer>
  );
}
