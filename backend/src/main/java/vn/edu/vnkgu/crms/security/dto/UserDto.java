package vn.edu.vnkgu.crms.security.dto;

import vn.edu.vnkgu.crms.security.User;

import java.time.Instant;

public record UserDto(
        Long id,
        String username,
        String fullName,
        String email,
        String unit,
        String role,
        boolean active,
        Instant lastLogin
) {
    public static UserDto from(User u) {
        return new UserDto(u.getId(), u.getUsername(), u.getFullName(), u.getEmail(), u.getUnit(),
                u.getRole().getCode(), u.isActive(), u.getLastLogin());
    }
}
