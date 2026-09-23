import type { ThemeConfig } from "antd";

/**
 * CRMS-KGU visual identity — clean/minimal, Material-influenced. Hex values
 * here must stay in sync with the CSS custom properties in index.css; AntD's
 * theme tokens can't read CSS vars. See CLAUDE.md "Giao diện" for the earlier
 * ornate ("bảng tên phòng / con dấu") pass this replaced and why.
 */
export const crmsTheme: ThemeConfig = {
  token: {
    colorPrimary: "#0f9d6e",
    colorLink: "#0f9d6e",
    colorSuccess: "#0f9d6e",
    colorWarning: "#b7791f",
    colorError: "#d33d2e",
    colorInfo: "#0f9d6e",
    colorText: "#384152",
    colorTextSecondary: "#667085",
    colorBorder: "#e6e8eb",
    colorBgLayout: "#f6f7f9",
    colorBgContainer: "#ffffff",
    fontFamily: "'Be Vietnam Pro', -apple-system, 'Segoe UI', sans-serif",
    borderRadius: 8,
    borderRadiusLG: 10,
    wireframe: false,
  },
  components: {
    Layout: {
      headerBg: "#ffffff",
      siderBg: "#ffffff",
      bodyBg: "#f6f7f9",
      headerColor: "#1c1f26",
    },
    Menu: {
      itemBorderRadius: 6,
      itemSelectedBg: "#e3f6ee",
      itemSelectedColor: "#0b7a52",
      itemHoverBg: "#f6f7f9",
    },
    Button: {
      fontWeight: 600,
      primaryShadow: "none",
      controlHeightLG: 44,
    },
    Card: {
      borderRadiusLG: 10,
      colorBorderSecondary: "#e6e8eb",
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Table: {
      headerBg: "#f6f7f9",
      headerColor: "#1c1f26",
      borderColor: "#e6e8eb",
    },
  },
};
