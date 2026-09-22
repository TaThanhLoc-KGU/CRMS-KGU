package vn.edu.vnkgu.crms.asset.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record AssetRequest(
        @NotBlank(message = "Mã tài sản không được để trống") String assetCode,
        @NotBlank(message = "Tên tài sản không được để trống") String name,
        String category,
        @Min(value = 0, message = "Số lượng không được âm") Integer quantity,
        String unit,
        String condition,
        Integer purchaseYear,
        Boolean movable,
        String note
) {
}
