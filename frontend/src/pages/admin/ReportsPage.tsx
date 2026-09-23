import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Typography, DatePicker, Button, Space, Table, Statistic, Row, Col, Card } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { downloadUsageReportExcel, getUsageReport, type RoomUsage, type UnitStats } from "../../api/reports";

const { RangePicker } = DatePicker;

export default function ReportsPage() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(90, "day"), dayjs()]);

  const from = range[0].startOf("day").toISOString();
  const to = range[1].endOf("day").toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ["usage-report", from, to],
    queryFn: () => getUsageReport(from, to),
  });

  return (
    <div>
      <Typography.Title level={4}>Báo cáo & thống kê</Typography.Title>
      <Space style={{ marginBottom: 16 }}>
        <RangePicker
          value={range}
          onChange={(values) => values && setRange(values as [Dayjs, Dayjs])}
          format="DD/MM/YYYY"
        />
        <Button icon={<DownloadOutlined />} onClick={() => downloadUsageReportExcel(from, to)}>
          Xuất Excel
        </Button>
      </Space>

      {data && (
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic title="Tổng số đơn" value={data.totalBookings} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Đã duyệt" value={data.totalApproved} valueStyle={{ color: "#3f8600" }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Từ chối" value={data.totalRejected} valueStyle={{ color: "#cf1322" }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="TG xử lý trung bình (giờ)"
                  value={data.avgProcessingHours ?? "-"}
                  precision={data.avgProcessingHours != null ? 1 : 0}
                />
              </Card>
            </Col>
          </Row>

          <Typography.Title level={5}>Tần suất sử dụng theo phòng</Typography.Title>
          <Table<RoomUsage>
            rowKey="roomId"
            pagination={false}
            dataSource={data.roomUsage}
            style={{ marginBottom: 24 }}
            columns={[
              { title: "Mã phòng", dataIndex: "roomCode", width: 120 },
              { title: "Tên phòng", dataIndex: "roomName" },
              { title: "Số đơn", dataIndex: "bookingCount", width: 100 },
              { title: "Tổng giờ sử dụng", dataIndex: "totalHours", width: 150 },
            ]}
          />

          <Typography.Title level={5}>Thống kê theo đơn vị</Typography.Title>
          <Table<UnitStats>
            rowKey="unit"
            pagination={false}
            dataSource={data.unitStats}
            columns={[
              { title: "Đơn vị", dataIndex: "unit" },
              { title: "Tổng số đơn", dataIndex: "totalRequests", width: 120 },
              { title: "Đã duyệt", dataIndex: "approved", width: 100 },
              { title: "Từ chối", dataIndex: "rejected", width: 100 },
              { title: "Tỷ lệ duyệt", dataIndex: "approvalRatePercent", width: 120, render: (v: number) => `${v}%` },
            ]}
          />
        </>
      )}
      {isLoading && <div>Đang tải...</div>}
    </div>
  );
}
