import { useState } from "react";
import { Form, Input, Button, Typography, Alert } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { extractErrorMessage } from "../api/client";
import { t } from "../i18n";

interface LocationState {
  from?: { pathname: string };
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      await login(values);
      const state = location.state as LocationState | null;
      navigate(state?.from?.pathname ?? "/admin/rooms", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: 24,
      }}
    >
      <div style={{ width: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 10 }}>
            <span style={{ color: "var(--ink-800)" }}>CRMS</span>
            <span style={{ color: "var(--primary-600)" }}>-KGU</span>
          </div>
          <Typography.Title level={4} style={{ margin: "0 0 4px" }}>
            {t.auth.loginTitle}
          </Typography.Title>
          <Typography.Text type="secondary">Trung tâm Hội nghị — Trường Đại học Kiên Giang</Typography.Text>
        </div>

        <div
          className="crms-glass"
          style={{
            padding: "28px 28px 8px",
          }}
        >
          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
          <Form layout="vertical" onFinish={onFinish} disabled={loading}>
            <Form.Item
              name="username"
              label={t.auth.username}
              rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
            >
              <Input prefix={<UserOutlined />} autoFocus />
            </Form.Item>
            <Form.Item
              name="password"
              label={t.auth.password}
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                {t.auth.loginButton}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}
