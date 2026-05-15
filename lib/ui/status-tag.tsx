"use client";

import { Tag, type TagProps } from "antd";
import type { ReactNode } from "react";

type StatusTagProps = Omit<TagProps, "variant"> & {
  children: ReactNode;
};

const baseStatusTagStyles = {
  root: {
    border: "none",
    fontWeight: 400,
  },
};

export function StatusTag({ style, ...props }: StatusTagProps) {
  return (
    <Tag
      variant="solid"
      style={{
        ...baseStatusTagStyles.root,
        ...style,
      }}
      {...props}
    />
  );
}
