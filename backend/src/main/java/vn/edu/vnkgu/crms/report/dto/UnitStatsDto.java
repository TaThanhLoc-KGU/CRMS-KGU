package vn.edu.vnkgu.crms.report.dto;

public record UnitStatsDto(
        String unit,
        long totalRequests,
        long approved,
        long rejected,
        double approvalRatePercent
) {
}
