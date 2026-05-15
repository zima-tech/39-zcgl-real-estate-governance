import type { ThemeConfig } from "antd";

export const antdTheme: ThemeConfig = {
  token: {
    borderRadius: 6,
    colorBgLayout: "#f5f7fb",
    colorError: "#d93026",
    colorInfo: "#1764e8",
    colorPrimary: "#1764e8",
    colorSuccess: "#1f9d55",
    colorText: "#1f2937",
    colorTextBase: "#1f2937",
    colorWarning: "#d98500",
    controlHeight: 34,
    fontSize: 14,
    fontFamily:
      'var(--font-sans-stack), Arial, "Microsoft YaHei", "PingFang SC", sans-serif',
  },
  components: {
    Button: {
      borderRadius: 4,
      controlHeightLG: 40,
      fontWeight: 600,
      paddingInlineLG: 18,
    },
    Card: {
      borderRadiusLG: 6,
      bodyPadding: 18,
      paddingLG: 18,
    },
    Form: {
      itemMarginBottom: 16,
    },
    Layout: {
      bodyBg: "#f5f7fb",
      headerBg: "#ffffff",
      siderBg: "#ffffff",
    },
    Menu: {
      itemBorderRadius: 4,
    },
    Table: {
      cellPaddingBlock: 10,
      cellPaddingInline: 12,
    },
  },
};
