package vn.edu.vnkgu.crms.handover.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record HandoverItemUpdateRequest(
        @NotNull List<Item> items
) {
    public record Item(
            @NotNull Long itemId,
            String conditionAfter,
            String note
    ) {
    }
}
