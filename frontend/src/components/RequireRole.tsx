import type { ReactElement } from "react";
import { Result } from "antd";
import { useAuth } from "../hooks/useAuth";

export default function RequireRole({ roles, children }: { roles: string[]; children: ReactElement }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Result status="403" title="Không có quyền truy cập" subTitle="Chức năng này chỉ dành cho vai trò phù hợp." />;
  }

  return children;
}
