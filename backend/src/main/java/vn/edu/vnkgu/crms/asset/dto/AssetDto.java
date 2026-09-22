package vn.edu.vnkgu.crms.asset.dto;

import vn.edu.vnkgu.crms.asset.Asset;

import java.time.Instant;

public record AssetDto(
        Long id,
        Long roomId,
        String assetCode,
        String name,
        String category,
        int quantity,
        String unit,
        String condition,
        Integer purchaseYear,
        boolean movable,
        String note,
        Instant createdAt,
        Instant updatedAt
) {
    public static AssetDto from(Asset asset) {
        return new AssetDto(
                asset.getId(),
                asset.getRoom().getId(),
                asset.getAssetCode(),
                asset.getName(),
                asset.getCategory(),
                asset.getQuantity(),
                asset.getUnit(),
                asset.getCondition(),
                asset.getPurchaseYear(),
                asset.isMovable(),
                asset.getNote(),
                asset.getCreatedAt(),
                asset.getUpdatedAt());
    }
}
