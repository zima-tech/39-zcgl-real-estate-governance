import { Alert } from "antd";

type ManagementListContentProps = {
  children: React.ReactNode;
  currentPage: number;
  emptyResultsText?: string;
  pageError: string | null;
  pageErrorTitle?: string;
  pageSize: number;
  pagination: React.ReactNode;
  totalItems: number;
  totalLabel: string;
};

export function ManagementListContent({
  children,
  currentPage,
  emptyResultsText = "当前没有匹配结果。",
  pageError,
  pageErrorTitle = "加载失败",
  pageSize,
  pagination,
  totalItems,
  totalLabel,
}: ManagementListContentProps) {
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex =
    totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col">
      {pageError ? (
        <Alert
          className="mb-5"
          type="error"
          showIcon
          title={pageErrorTitle}
          description={pageError}
        />
      ) : null}

      <div>{children}</div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80 pt-4">
        <p className="text-sm text-stone-500">
          {totalItems === 0
            ? emptyResultsText
            : `显示 ${startIndex}-${endIndex} / ${totalItems} ${totalLabel}`}
        </p>

        {pagination}
      </div>
    </div>
  );
}
