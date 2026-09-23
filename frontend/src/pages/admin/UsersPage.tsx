import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, Button, Space, Tag, Modal, Form, Input, Select, Switch, message } from "antd";
import { PlusOutlined, EditOutlined, KeyOutlined } from "@ant-design/icons";
import {
  createUser,
  listUsers,
  resetUserPassword,
  updateUser,
  type AppUser,
  type UserCreateRequest,
  type UserUpdateRequest,
} from "../../api/users";
import { extractErrorMessage } from "../../api/client";

const ROLE_OPTIONS = [
  { label: "Quản trị viên (ADMIN)", value: "ADMIN" },
  { label: "Người lập phiếu (OFFICER)", value: "OFFICER" },
  { label: "Người duyệt (APPROVER)", value: "APPROVER" },
];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [resettingUser, setResettingUser] = useState<AppUser | null>(null);
  const [createForm] = Form.useForm<UserCreateRequest>();
  const [editForm] = Form.useForm<UserUpdateRequest>();
  const [newPassword, setNewPassword] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["users"], queryFn: listUsers });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const createMutation = useMutation({
    mutationFn: (values: UserCreateRequest) => createUser(values),
    onSuccess: () => {
      message.success("Đã tạo người dùng");
      setCreateOpen(false);
      createForm.resetFields();
      invalidate();
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: UserUpdateRequest }) => updateUser(id, values),
    onSuccess: () => {
      message.success("Đã cập nhật");
      setEditingUser(null);
      invalidate();
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) => resetUserPassword(id, password),
    onSuccess: () => {
      message.success("Đã đặt lại mật khẩu");
      setResettingUser(null);
      setNewPassword("");
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  return (
    <div>
      <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>Người dùng nội bộ</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Thêm người dùng
        </Button>
      </Space>

      <Table<AppUser>
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        pagination={false}
        columns={[
          { title: "Tên đăng nhập", dataIndex: "username" },
          { title: "Họ tên", dataIndex: "fullName" },
          { title: "Email", dataIndex: "email" },
          { title: "Đơn vị", dataIndex: "unit" },
          { title: "Vai trò", dataIndex: "role", render: (r: string) => <Tag>{r}</Tag> },
          {
            title: "Trạng thái",
            dataIndex: "active",
            render: (a: boolean) => <Tag color={a ? "green" : "red"}>{a ? "Hoạt động" : "Đã khóa"}</Tag>,
          },
          {
            title: "Thao tác",
            render: (_, user) => (
              <Space>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingUser(user);
                    editForm.setFieldsValue({
                      fullName: user.fullName,
                      email: user.email,
                      unit: user.unit ?? undefined,
                      roleCode: user.role,
                      active: user.active,
                    });
                  }}
                />
                <Button size="small" icon={<KeyOutlined />} onClick={() => setResettingUser(user)} />
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title="Thêm người dùng"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.validateFields().then((v) => createMutation.mutate(v))}
        confirmLoading={createMutation.isPending}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="fullName" label="Họ tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="unit" label="Đơn vị">
            <Input />
          </Form.Item>
          <Form.Item name="roleCode" label="Vai trò" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Sửa người dùng"
        open={!!editingUser}
        onCancel={() => setEditingUser(null)}
        onOk={() =>
          editForm.validateFields().then((v) => editingUser && updateMutation.mutate({ id: editingUser.id, values: v }))
        }
        confirmLoading={updateMutation.isPending}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="fullName" label="Họ tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="unit" label="Đơn vị">
            <Input />
          </Form.Item>
          <Form.Item name="roleCode" label="Vai trò" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item name="active" label="Hoạt động" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Đặt lại mật khẩu — ${resettingUser?.username}`}
        open={!!resettingUser}
        onCancel={() => setResettingUser(null)}
        onOk={() => resettingUser && resetPasswordMutation.mutate({ id: resettingUser.id, password: newPassword })}
        confirmLoading={resetPasswordMutation.isPending}
        okButtonProps={{ disabled: newPassword.length < 6 }}
      >
        <Input.Password
          placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </Modal>
    </div>
  );
}
