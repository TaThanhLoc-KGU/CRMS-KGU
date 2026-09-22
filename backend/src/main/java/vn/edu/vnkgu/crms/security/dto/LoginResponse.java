package vn.edu.vnkgu.crms.security.dto;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        String username,
        String fullName,
        String role
) {
}
