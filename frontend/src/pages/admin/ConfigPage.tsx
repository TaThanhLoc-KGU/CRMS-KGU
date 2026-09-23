import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Collapse, Form, Input, InputNumber, Switch, Button, Typography, message, Space, Modal } from "antd";
import { listConfig, updateConfig, testSmtp, type ConfigItem } from "../../api/config";
import { extractErrorMessage } from "../../api/client";

const GROUP_LABEL: Record<string, string> = {
  booking: "Đặt phòng",
  schedule: "Giờ làm việc",
  upload: "Upload tệp",
  mail: "Email",
  calendar: "Lịch",
  security: "Bảo mật",
  branding: "Thương hiệu",
};

function renderField(item: ConfigItem) {
  switch (item.valueType) {
    case "BOOL":
      return <Switch />;
    case "INT":
      return <InputNumber style={{ width: "100%" }} />;
    default:
      return <Input />;
  }
}

export default function ConfigPage() {
  const [form] = Form.useForm();
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["config"], queryFn: listConfig });

  useEffect(() => {
    if (!data) return;
    const initial: Record<string, string | number | boolean> = {};
    Object.values(data).flat().forEach((item) => {
      if (item.valueType === "BOOL") initial[item.key] = item.value === "true";
      else if (item.valueType === "INT") initial[item.key] = Number(item.value);
      else initial[item.key] = item.value;
    });
    form.setFieldsValue(initial);
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => {
      const payload: Record<string, string> = {};
      Object.entries(values).forEach(([key, value]) => {
        payload[key] = String(value);
      });
      return updateConfig(payload);
    },
    onSuccess: () => message.success("Đã lưu cấu hình"),
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const smtpTestMutation = useMutation({
    mutationFn: (email: string) => testSmtp(email),
    onSuccess: () => {
      message.success("Đã gửi email thử thành công");
      setTestEmailOpen(false);
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  if (isLoading || !data) {
    return <div>Đang tải...</div>;
  }

  return (
    <div>
      <Typography.Title level={4}>Cấu hình hệ thống</Typography.Title>
      <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
        <Collapse
          defaultActiveKey={Object.keys(data)}
          items={Object.entries(data).map(([group, items]) => ({
            key: group,
            label: GROUP_LABEL[group] ?? group,
            children: (
              <>
                {items.map((item) => (
                  <Form.Item
                    key={item.key}
                    name={item.key}
                    label={item.description ?? item.key}
                    valuePropName={item.valueType === "BOOL" ? "checked" : "value"}
                    style={{ maxWidth: 480 }}
                  >
                    {renderField(item)}
                  </Form.Item>
                ))}
                {group === "mail" && (
                  <Button onClick={() => setTestEmailOpen(true)}>Gửi email thử</Button>
                )}
              </>
            ),
          }))}
        />

        <Space style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
            Lưu cấu hình
          </Button>
        </Space>
      </Form>

      <Modal
        title="Gửi email thử"
        open={testEmailOpen}
        onCancel={() => setTestEmailOpen(false)}
        onOk={() => smtpTestMutation.mutate(testEmail)}
        confirmLoading={smtpTestMutation.isPending}
      >
        <Input
          placeholder="Nhập email nhận thử"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
        />
      </Modal>
    </div>
  );
}
