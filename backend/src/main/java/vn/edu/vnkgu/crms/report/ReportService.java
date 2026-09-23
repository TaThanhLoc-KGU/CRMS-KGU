package vn.edu.vnkgu.crms.report;

import vn.edu.vnkgu.crms.booking.Booking;
import vn.edu.vnkgu.crms.booking.BookingRepository;
import vn.edu.vnkgu.crms.booking.BookingStatus;
import vn.edu.vnkgu.crms.report.dto.ReportSummaryDto;
import vn.edu.vnkgu.crms.report.dto.RoomUsageDto;
import vn.edu.vnkgu.crms.report.dto.UnitStatsDto;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private static final Set<BookingStatus> DECIDED_APPROVED_LIKE = Set.of(
            BookingStatus.APPROVED, BookingStatus.SLIP_ISSUED, BookingStatus.IN_USE,
            BookingStatus.RETURNED, BookingStatus.CLOSED);

    private final BookingRepository bookingRepository;

    public ReportService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    public ReportSummaryDto usageSummary(Instant from, Instant to) {
        List<Booking> bookings = bookingRepository.findBySubmittedAtBetween(from, to);

        List<RoomUsageDto> roomUsage = bookings.stream()
                .filter(b -> DECIDED_APPROVED_LIKE.contains(b.getStatus()))
                .collect(Collectors.groupingBy(b -> b.getRoom().getId()))
                .entrySet().stream()
                .map(entry -> {
                    List<Booking> roomBookings = entry.getValue();
                    Booking sample = roomBookings.get(0);
                    double hours = roomBookings.stream()
                            .mapToDouble(b -> Duration.between(b.getStartTime(), b.getEndTime()).toMinutes() / 60.0)
                            .sum();
                    return new RoomUsageDto(sample.getRoom().getId(), sample.getRoom().getCode(),
                            sample.getRoom().getName(), roomBookings.size(), Math.round(hours * 10) / 10.0);
                })
                .sorted(Comparator.comparingLong(RoomUsageDto::bookingCount).reversed())
                .toList();

        List<UnitStatsDto> unitStats = bookings.stream()
                .collect(Collectors.groupingBy(Booking::getRequesterUnit))
                .entrySet().stream()
                .map(entry -> {
                    List<Booking> unitBookings = entry.getValue();
                    long approved = unitBookings.stream()
                            .filter(b -> DECIDED_APPROVED_LIKE.contains(b.getStatus())).count();
                    long rejected = unitBookings.stream()
                            .filter(b -> b.getStatus() == BookingStatus.REJECTED).count();
                    long decided = approved + rejected;
                    double rate = decided == 0 ? 0.0 : Math.round(approved * 1000.0 / decided) / 10.0;
                    return new UnitStatsDto(entry.getKey(), unitBookings.size(), approved, rejected, rate);
                })
                .sorted(Comparator.comparingLong(UnitStatsDto::totalRequests).reversed())
                .toList();

        List<Booking> decidedBookings = bookings.stream().filter(b -> b.getDecidedAt() != null).toList();
        Double avgProcessingHours = decidedBookings.isEmpty() ? null
                : decidedBookings.stream()
                        .mapToDouble(b -> Duration.between(b.getSubmittedAt(), b.getDecidedAt()).toMinutes() / 60.0)
                        .average().orElse(0.0);
        if (avgProcessingHours != null) {
            avgProcessingHours = Math.round(avgProcessingHours * 10) / 10.0;
        }

        long totalApproved = bookings.stream().filter(b -> DECIDED_APPROVED_LIKE.contains(b.getStatus())).count();
        long totalRejected = bookings.stream().filter(b -> b.getStatus() == BookingStatus.REJECTED).count();
        long totalCancelled = bookings.stream().filter(b -> b.getStatus() == BookingStatus.CANCELLED).count();

        return new ReportSummaryDto(roomUsage, unitStats, avgProcessingHours, bookings.size(),
                totalApproved, totalRejected, totalCancelled);
    }

    public byte[] exportUsageExcel(Instant from, Instant to) {
        ReportSummaryDto summary = usageSummary(from, to);
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet roomSheet = workbook.createSheet("Tần suất theo phòng");
            Row roomHeader = roomSheet.createRow(0);
            writeCells(roomHeader, "Mã phòng", "Tên phòng", "Số đơn", "Tổng giờ sử dụng");
            int r = 1;
            for (RoomUsageDto usage : summary.roomUsage()) {
                Row row = roomSheet.createRow(r++);
                writeCells(row, usage.roomCode(), usage.roomName(), String.valueOf(usage.bookingCount()),
                        String.valueOf(usage.totalHours()));
            }

            Sheet unitSheet = workbook.createSheet("Thống kê theo đơn vị");
            Row unitHeader = unitSheet.createRow(0);
            writeCells(unitHeader, "Đơn vị", "Tổng số đơn", "Đã duyệt", "Từ chối", "Tỷ lệ duyệt (%)");
            int u = 1;
            for (UnitStatsDto stats : summary.unitStats()) {
                Row row = unitSheet.createRow(u++);
                writeCells(row, stats.unit(), String.valueOf(stats.totalRequests()), String.valueOf(stats.approved()),
                        String.valueOf(stats.rejected()), String.valueOf(stats.approvalRatePercent()));
            }

            for (int i = 0; i < 4; i++) {
                roomSheet.autoSizeColumn(i);
            }
            for (int i = 0; i < 5; i++) {
                unitSheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("Không thể xuất báo cáo Excel", e);
        }
    }

    private void writeCells(Row row, String... values) {
        for (int i = 0; i < values.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(values[i]);
        }
    }
}
