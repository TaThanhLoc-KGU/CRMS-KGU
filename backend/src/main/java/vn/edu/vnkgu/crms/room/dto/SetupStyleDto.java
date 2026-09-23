package vn.edu.vnkgu.crms.room.dto;

import vn.edu.vnkgu.crms.room.SetupStyle;

public record SetupStyleDto(Long id, String code, String name, String description, String icon) {
    public static SetupStyleDto from(SetupStyle s) {
        return new SetupStyleDto(s.getId(), s.getCode(), s.getName(), s.getDescription(), s.getIcon());
    }
}
