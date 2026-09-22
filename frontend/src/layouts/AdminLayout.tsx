import { Layout, Menu, Button, Typography, Space } from "antd";
import { HomeOutlined, LogoutOutlined } from "@ant-design/icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = location.pathname.startsWith("/admin/rooms") ? "rooms" : "";

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
          items={[
            {
              key: "rooms",
              icon: <HomeOutlined />,
              label: "Quản lý phòng",
              onClick: () => navigate("/admin/rooms"),
            },
          ]}
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
            <Text>{user?.fullName ?? user?.username}</Text>
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
