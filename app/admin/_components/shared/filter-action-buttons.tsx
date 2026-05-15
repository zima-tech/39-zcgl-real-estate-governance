"use client";

import { Button } from "antd";
import type { ReactNode } from "react";

type FilterActionButtonsProps = {
  extra?: ReactNode;
  onReset: () => void;
  resetDisabled?: boolean;
  searchDisabled?: boolean;
  searchLoading?: boolean;
};

function ResetIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="14"
      viewBox="0 0 16 16"
      width="14"
    >
      <path
        d="M3.2 5.9A5.2 5.2 0 1 1 2.8 10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M2.5 2.8v3.5H6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="14"
      viewBox="0 0 16 16"
      width="14"
    >
      <path
        d="M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="m10.8 10.8 3 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function FilterActionButtons({
  extra,
  onReset,
  resetDisabled,
  searchDisabled,
  searchLoading,
}: FilterActionButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3 self-end">
      <Button disabled={resetDisabled} icon={<ResetIcon />} onClick={onReset}>
        重置
      </Button>
      <Button
        disabled={searchDisabled}
        htmlType="submit"
        icon={<SearchIcon />}
        loading={searchLoading}
        type="primary"
      >
        搜索
      </Button>
      {extra}
    </div>
  );
}
