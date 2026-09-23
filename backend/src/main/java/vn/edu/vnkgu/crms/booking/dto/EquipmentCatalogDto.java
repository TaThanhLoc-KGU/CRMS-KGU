package vn.edu.vnkgu.crms.booking.dto;

import vn.edu.vnkgu.crms.booking.EquipmentCatalog;

public record EquipmentCatalogDto(
        Long id,
        String code,
        String name,
        String unit,
        boolean shared,
        int defaultQuantity
) {
    public static EquipmentCatalogDto from(EquipmentCatalog e) {
        return new EquipmentCatalogDto(e.getId(), e.getCode(), e.getName(), e.getUnit(), e.isShared(), e.getDefaultQuantity());
    }
}
