package vn.edu.vnkgu.crms.handover.dto;

import vn.edu.vnkgu.crms.handover.HandoverItem;

public record HandoverItemDto(
        Long id,
        Long assetId,
        String itemName,
        int quantity,
        String conditionBefore,
        String conditionAfter,
        String note
) {
    public static HandoverItemDto from(HandoverItem item) {
        return new HandoverItemDto(
                item.getId(),
                item.getAsset() != null ? item.getAsset().getId() : null,
                item.getItemName(),
                item.getQuantity(),
                item.getConditionBefore(),
                item.getConditionAfter(),
                item.getNote());
    }
}
