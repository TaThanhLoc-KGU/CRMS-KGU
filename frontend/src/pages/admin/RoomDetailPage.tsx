import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Descriptions,
  Space,
  Table,
  Tag,
  Typography,
  Popconfirm,
  message,
  Breadcrumb,
} from "antd";
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { getRoom, type RoomStatus } from "../../api/rooms";
import {
  ASSET_CONDITION_LABEL,
  createAsset,
  deleteAsset,
  listAssetsByRoom,
  updateAsset,
  type Asset,
  type AssetRequest,
} from "../../api/assets";
import { extractErrorMessage } from "../../api/client";
import AssetFormModal from "../../components/AssetFormModal";
import { t } from "../../i18n";

const STATUS_LABEL: Record<RoomStatus, string> = {
  ACTIVE: "Hoạt động",
  MAINTENANCE: "Bảo trì",
  DISABLED: "Ngừng sử dụng",
};

export default function RoomDetailPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const id = Number(roomId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const roomQuery = useQuery({ queryKey: ["rooms", id], queryFn: () => getRoom(id) });
  const assetsQuery = useQuery({
    queryKey: ["rooms", id, "assets"],
    queryFn: () => listAssetsByRoom(id),
  });

  const invalidateAssets = () =>
    queryClient.invalidateQueries({ queryKey: ["rooms", id, "assets"] });

  const createMutation = useMutation({
    mutationFn: (values: AssetRequest) => createAsset(id, values),
    onSuccess: () => {
      message.success("Đã thêm tài sản");
      setModalOpen(false);
      invalidateAssets();
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ assetId, values }: { assetId: number; values: AssetRequest }) =>
      updateAsset(assetId, values),
    onSuccess: () => {
      message.success("Đã cập nhật tài sản");
      setModalOpen(false);
      setEditingAsset(null);
      invalidateAssets();
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (assetId: number) => deleteAsset(assetId),
    onSuccess: () => {
      message.success("Đã xóa tài sản");
      invalidateAssets();
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const room = roomQuery.data;

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          { title: <a onClick={() => navigate("/admin/rooms")}>{t.rooms.title}</a> },
          { title: room?.name ?? "..." },
        ]}
      />

      <Button
        icon={<ArrowLeftOutlined />}
        style={{ marginBottom: 16 }}
        onClick={() => navigate("/admin/rooms")}
      >
        Quay lại danh sách phòng
      </Button>

      {room && (
        <Descriptions
          title={`${room.code} — ${room.name}`}
          bordered
          size="small"
          column={2}
          style={{ marginBottom: 24, background: "#fff" }}
        >
          <Descriptions.Item label={t.rooms.building}>{room.building ?? "-"}</Descriptions.Item>
          <Descriptions.Item label={t.rooms.floor}>{room.floor ?? "-"}</Descriptions.Item>
          <Descriptions.Item label={t.rooms.capacity}>{room.capacity ?? "-"}</Descriptions.Item>
          <Descriptions.Item label={t.rooms.status}>
            <Tag>{STATUS_LABEL[room.status]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t.rooms.description} span={2}>
            {room.description ?? "-"}
          </Descriptions.Item>
        </Descriptions>
      )}

      <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t.assets.title}
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingAsset(null);
            setModalOpen(true);
          }}
        >
          {t.assets.addAsset}
        </Button>
      </Space>

      <Table<Asset>
        rowKey="id"
        loading={assetsQuery.isLoading}
        dataSource={assetsQuery.data ?? []}
        pagination={false}
        columns={[
          { title: t.assets.assetCode, dataIndex: "assetCode", width: 140 },
          { title: t.assets.name, dataIndex: "name" },
          { title: t.assets.category, dataIndex: "category" },
          { title: t.assets.quantity, dataIndex: "quantity", width: 90 },
          { title: t.assets.unit, dataIndex: "unit", width: 100 },
          {
            title: t.assets.condition,
            dataIndex: "condition",
            width: 100,
            render: (condition: string) => ASSET_CONDITION_LABEL[condition] ?? condition,
          },
          {
            title: t.assets.movable,
            dataIndex: "movable",
            width: 90,
            render: (movable: boolean) => (movable ? <Tag color="blue">Di động</Tag> : <Tag>Cố định</Tag>),
          },
          {
            title: t.common.actions,
            key: "actions",
            width: 120,
            render: (_, asset) => (
              <Space>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingAsset(asset);
                    setModalOpen(true);
                  }}
                />
                <Popconfirm
                  title={t.common.confirmDeleteTitle}
                  onConfirm={() => deleteMutation.mutate(asset.id)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <AssetFormModal
        open={modalOpen}
        asset={editingAsset}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        onCancel={() => {
          setModalOpen(false);
          setEditingAsset(null);
        }}
        onSubmit={(values) => {
          if (editingAsset) {
            updateMutation.mutate({ assetId: editingAsset.id, values });
          } else {
            createMutation.mutate(values);
          }
        }}
      />
    </div>
  );
}
