import type { ThemeConfig } from "antd";

/**
 * CRMS-KGU visual identity — "Liquid Glass": translucent, frosted surfaces
 * over a soft colorful mesh (see index.css's header comment). Hex/rgba values
 * here must stay in sync with the CSS custom properties in index.css; AntD's
 * theme tokens can't express `backdrop-filter` — that half lives in index.css
 * via `.ant-*` class overrides, this half only sets the (translucent)
 * background colors those overrides blur. `colorBgLayout` MUST stay
 * "transparent" — anything opaque here sits between the body's mesh and the
 * glass panels, and nothing blurs.
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
    colorBorder: "rgba(255, 255, 255, 0.6)",
    colorBgLayout: "transparent",
    colorBgContainer: "rgba(255, 255, 255, 0.68)",
    colorBgElevated: "rgba(255, 255, 255, 0.82)",
    fontFamily: "'Be Vietnam Pro', -apple-system, 'Segoe UI', sans-serif",
    borderRadius: 14,
    borderRadiusLG: 20,
    wireframe: false,
  },
  components: {
    Layout: {
      headerBg: "rgba(255, 255, 255, 0.72)",
      siderBg: "rgba(255, 255, 255, 0.72)",
      bodyBg: "transparent",
      headerColor: "#1c1f26",
    },
    Menu: {
      itemBorderRadius: 999,
      itemSelectedBg: "rgba(15, 157, 110, 0.16)",
      itemSelectedColor: "#0b7a52",
      itemHoverBg: "rgba(15, 157, 110, 0.08)",
    },
    Button: {
      fontWeight: 600,
      primaryShadow: "none",
      controlHeightLG: 44,
      borderRadius: 999,
      borderRadiusLG: 999,
      borderRadiusSM: 999,
    },
    Card: {
      borderRadiusLG: 20,
      colorBorderSecondary: "rgba(255, 255, 255, 0.6)",
    },
    Tag: {
      borderRadiusSM: 999,
    },
    Table: {
      headerBg: "rgba(255, 255, 255, 0.5)",
      headerColor: "#1c1f26",
      borderColor: "rgba(255, 255, 255, 0.5)",
      colorBgContainer: "rgba(255, 255, 255, 0.55)",
    },
    Input: {
      colorBgContainer: "rgba(255, 255, 255, 0.6)",
    },
    Select: {
      colorBgContainer: "rgba(255, 255, 255, 0.6)",
      colorBgElevated: "rgba(255, 255, 255, 0.82)",
    },
    Modal: {
      contentBg: "rgba(255, 255, 255, 0.82)",
      headerBg: "transparent",
    },
  },
};
