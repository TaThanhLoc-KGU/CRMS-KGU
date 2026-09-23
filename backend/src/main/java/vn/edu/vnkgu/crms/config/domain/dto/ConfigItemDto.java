package vn.edu.vnkgu.crms.config.domain.dto;

import vn.edu.vnkgu.crms.config.domain.Configuration;

public record ConfigItemDto(
        String key,
        String value,
        String valueType,
        String group,
        String description
) {
    public static ConfigItemDto from(Configuration c) {
        return new ConfigItemDto(c.getKey(), c.getValue(), c.getValueType(), c.getGroup(), c.getDescription());
    }
}
