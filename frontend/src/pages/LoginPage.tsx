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
        background: "linear-gradient(165deg, var(--ink-900), var(--ink-700) 78%)",
        padding: 24,
      }}
    >
      <div style={{ width: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <span
            aria-hidden
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: "1.5px solid var(--brass-500)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--brass-300)",
              marginBottom: 16,
            }}
          >
            KGU
          </span>
          <Typography.Title level={3} style={{ color: "var(--paper-0)", margin: "0 0 6px" }}>
            {t.auth.loginTitle}
          </Typography.Title>
          <Typography.Text style={{ color: "rgba(251,249,244,0.62)" }}>
            Trung tâm Hội nghị — Trường Đại học Kiên Giang
          </Typography.Text>
        </div>

        <div
          style={{
            background: "var(--paper-0)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--paper-line)",
            boxShadow: "var(--shadow-plaque)",
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
