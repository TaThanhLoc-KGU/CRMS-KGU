package vn.edu.vnkgu.crms.report.dto;

import java.util.List;

public record ReportSummaryDto(
        List<RoomUsageDto> roomUsage,
        List<UnitStatsDto> unitStats,
        Double avgProcessingHours,
        long totalBookings,
        long totalApproved,
        long totalRejected,
        long totalCancelled
) {
}
