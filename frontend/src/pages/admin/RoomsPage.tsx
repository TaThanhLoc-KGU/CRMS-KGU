import { useState } from "react";
import { Table, Button, Space, Tag, Popconfirm, message, Typography, Input } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, ToolOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  createRoom,
  deleteRoom,
  listRooms,
  updateRoom,
  type Room,
  type RoomRequest,
  type RoomStatus,
} from "../../api/rooms";
import { extractErrorMessage } from "../../api/client";
import RoomFormModal from "../../components/RoomFormModal";
import { t } from "../../i18n";

const STATUS_COLOR: Record<RoomStatus, string> = {
  ACTIVE: "green",
  MAINTENANCE: "orange",
  DISABLED: "red",
};

const STATUS_LABEL: Record<RoomStatus, string> = {
  ACTIVE: "Hoạt động",
  MAINTENANCE: "Bảo trì",
  DISABLED: "Ngừng sử dụng",
};

export default function RoomsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["rooms", keyword],
    queryFn: () => listRooms({ keyword: keyword || undefined }),
  });

  const invalidateRooms = () => queryClient.invalidateQueries({ queryKey: ["rooms"] });

  const createMutation = useMutation({
    mutationFn: (values: RoomRequest) => createRoom(values),
    onSuccess: () => {
      message.success("Đã thêm phòng");
      setModalOpen(false);
      invalidateRooms();
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: RoomRequest }) => updateRoom(id, values),
    onSuccess: () => {
      message.success("Đã cập nhật phòng");
      setModalOpen(false);
      setEditingRoom(null);
      invalidateRooms();
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteRoom(id),
    onSuccess: () => {
      message.success("Đã xóa phòng");
      invalidateRooms();
    },
    onError: (err) => message.error(extractErrorMessage(err)),
  });

  return (
    <div>
      <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t.rooms.title}
        </Typography.Title>
        <Space>
          <Input.Search
            placeholder="Tìm theo mã hoặc tên phòng"
            allowClear
            onSearch={setKeyword}
            style={{ width: 260 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRoom(null);
              setModalOpen(true);
            }}
          >
            {t.rooms.addRoom}
          </Button>
        </Space>
      </Space>

      <Table<Room>
        rowKey="id"
        loading={isLoading}
        dataSource={data?.content ?? []}
        pagination={false}
        columns={[
          { title: t.rooms.code, dataIndex: "code", width: 110 },
          { title: t.rooms.name, dataIndex: "name" },
          { title: t.rooms.building, dataIndex: "building" },
          { title: t.rooms.floor, dataIndex: "floor", width: 80 },
          { title: t.rooms.capacity, dataIndex: "capacity", width: 100 },
          {
            title: t.rooms.status,
            dataIndex: "status",
            width: 130,
            render: (status: RoomStatus) => <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>,
          },
          {
            title: t.common.actions,
            key: "actions",
            width: 220,
            render: (_, room) => (
              <Space>
                <Button
                  size="small"
                  icon={<ToolOutlined />}
                  onClick={() => navigate(`/admin/rooms/${room.id}`)}
                >
                  {t.rooms.manageAssets}
                </Button>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingRoom(room);
                    setModalOpen(true);
                  }}
                />
                <Popconfirm
                  title={t.common.confirmDeleteTitle}
                  onConfirm={() => deleteMutation.mutate(room.id)}
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

      <RoomFormModal
        open={modalOpen}
        room={editingRoom}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        onCancel={() => {
          setModalOpen(false);
          setEditingRoom(null);
        }}
        onSubmit={(values) => {
          if (editingRoom) {
            updateMutation.mutate({ id: editingRoom.id, values });
          } else {
            createMutation.mutate(values);
          }
        }}
      />
    </div>
  );
}
