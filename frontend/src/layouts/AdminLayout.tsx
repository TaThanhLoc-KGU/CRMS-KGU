import { Layout, Menu, Button, Typography, Space } from "antd";
import {
  HomeOutlined,
  LogoutOutlined,
  FileDoneOutlined,
  CalendarOutlined,
  SettingOutlined,
  TeamOutlined,
  BarChartOutlined,
  AuditOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "ADMIN";

  const menuItems = [
    { key: "rooms", path: "/admin/rooms", icon: <HomeOutlined />, label: "Quản lý phòng" },
    { key: "bookings", path: "/admin/bookings", icon: <FileDoneOutlined />, label: "Duyệt đơn" },
    { key: "calendar", path: "/admin/calendar", icon: <CalendarOutlined />, label: "Lịch nội bộ" },
    { key: "waitlist", path: "/admin/waitlist", icon: <ClockCircleOutlined />, label: "Danh sách chờ" },
    { key: "reports", path: "/admin/reports", icon: <BarChartOutlined />, label: "Báo cáo" },
    ...(isAdmin
      ? [
          { key: "users", path: "/admin/users", icon: <TeamOutlined />, label: "Người dùng" },
          { key: "config", path: "/admin/config", icon: <SettingOutlined />, label: "Cấu hình" },
          { key: "audit", path: "/admin/audit-logs", icon: <AuditOutlined />, label: "Nhật ký" },
        ]
      : []),
  ];

  const selectedKey = menuItems.find((item) => location.pathname.startsWith(item.path))?.key ?? "";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div
          style={{
            height: 48,
            margin: "20px 16px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 28,
              height: 28,
              flexShrink: 0,
              borderRadius: "50%",
              border: "1.5px solid var(--brass-500)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--brass-300)",
            }}
          >
            KGU
          </span>
          <span style={{ color: "#fbf9f4", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17 }}>
            CRMS-KGU
          </span>
        </div>
        <div style={{ margin: "0 16px 16px", height: 1, background: "rgba(216,185,121,0.25)" }} />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            onClick: () => navigate(item.path),
          }))}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "var(--paper-0)",
            borderBottom: "1px solid var(--paper-line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 24px",
          }}
        >
          <Space>
            <Text>{user?.fullName ?? user?.username} ({user?.role})</Text>
            <Button
              icon={<LogoutOutlined />}
              onClick={() => {
                logout();
                navigate("/admin/login");
              }}
            >
              Đăng xuất
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
