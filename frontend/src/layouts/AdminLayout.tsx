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
            margin: 16,
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          CRMS-KGU
        </div>
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
            background: "#fff",
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
