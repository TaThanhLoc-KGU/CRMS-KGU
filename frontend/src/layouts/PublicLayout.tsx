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
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 32,
          padding: "0 24px",
        }}
      >
        <Link to="/" style={{ whiteSpace: "nowrap", fontWeight: 700, fontSize: 18 }}>
          <span style={{ color: "var(--ink-800)" }}>CRMS</span>
          <span style={{ color: "var(--primary-600)" }}>-KGU</span>
        </Link>
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={NAV_ITEMS.map((item) => ({ key: item.key, label: item.label }))}
          onClick={(e) => navigate(e.key)}
          style={{ flex: 1, minWidth: 0, borderBottom: "none" }}
        />
        <Button type="primary" onClick={() => navigate("/admin/login")}>
          Đăng nhập quản trị
        </Button>
      </Header>
      <Content>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: "center", background: "var(--bg)", color: "var(--slate-500)" }}>
        Trung tâm Hội nghị — Trường Đại học Kiên Giang
      </Footer>
    </Layout>
  );
}
