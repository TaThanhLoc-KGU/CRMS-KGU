import type { ThemeConfig } from "antd";

/**
 * CRMS-KGU visual identity — see the header comment in index.css for the design
 * rationale ("room plaque / official seal"). Hex values here must stay in sync
 * with the CSS custom properties there; AntD's theme tokens can't read CSS vars.
 */
export const crmsTheme: ThemeConfig = {
  token: {
    colorPrimary: "#2f6d4f",
    colorLink: "#2f6d4f",
    colorSuccess: "#2f6d4f",
    colorWarning: "#b8892a",
    colorError: "#a63d33",
    colorInfo: "#14213d",
    colorText: "#333c4d",
    colorTextSecondary: "#5b6472",
    colorBorder: "#e3dcc8",
    colorBgLayout: "#f7f4ec",
    colorBgContainer: "#fbf9f4",
    fontFamily: "'Be Vietnam Pro', -apple-system, 'Segoe UI', sans-serif",
    borderRadius: 6,
    borderRadiusLG: 8,
    wireframe: false,
  },
  components: {
    Layout: {
      headerBg: "#14213d",
      siderBg: "#14213d",
      bodyBg: "#f7f4ec",
      headerColor: "#fbf9f4",
    },
    Menu: {
      darkItemBg: "#14213d",
      darkItemSelectedBg: "#1c2c4d",
      darkItemColor: "rgba(251,249,244,0.72)",
      darkItemHoverColor: "#fbf9f4",
      darkItemSelectedColor: "#d9b979",
      itemBorderRadius: 4,
    },
    Button: {
      fontWeight: 600,
      primaryShadow: "none",
      controlHeightLG: 44,
    },
    Card: {
      borderRadiusLG: 4,
      colorBorderSecondary: "#e3dcc8",
    },
    Tag: {
      borderRadiusSM: 4,
    },
    Table: {
      headerBg: "#f3e8d1",
      headerColor: "#14213d",
      borderColor: "#e3dcc8",
    },
  },
};
