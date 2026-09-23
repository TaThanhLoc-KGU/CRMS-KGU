import { Layout, Menu, Button } from "antd";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";

const { Header, Content, Footer } = Layout;

const NAV_ITEMS = [
  { key: "/", label: "Trang chủ" },
  { key: "/rooms", label: "Danh sách phòng" },
  { key: "/calendar", label: "Lịch phòng" },
  { key: "/lookup", label: "Tra cứu đơn" },
];

export default function PublicLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = NAV_ITEMS.find((item) => location.pathname.startsWith(item.key) && item.key !== "/")?.key
    ?? (location.pathname === "/" ? "/" : "");

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ display: "flex", alignItems: "center", gap: 32, padding: "0 24px" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
          <span
            aria-hidden
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: "1.5px solid var(--brass-500)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--brass-300)",
            }}
          >
            KGU
          </span>
          <span style={{ color: "#fbf9f4", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18 }}>
            CRMS-KGU
          </span>
        </Link>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={NAV_ITEMS.map((item) => ({ key: item.key, label: item.label }))}
          onClick={(e) => navigate(e.key)}
          style={{ flex: 1, minWidth: 0, background: "transparent", borderBottom: "none" }}
        />
        <Button ghost onClick={() => navigate("/admin/login")}>
          Đăng nhập quản trị
        </Button>
      </Header>
      <Content>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: "center", background: "var(--paper-100)", color: "var(--slate-500)" }}>
        Trung tâm Hội nghị — Trường Đại học Kiên Giang
      </Footer>
    </Layout>
  );
}
