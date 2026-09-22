package vn.edu.vnkgu.crms.security;

import vn.edu.vnkgu.crms.common.ApiException;
import vn.edu.vnkgu.crms.security.dto.LoginRequest;
import vn.edu.vnkgu.crms.security.dto.LoginResponse;
import vn.edu.vnkgu.crms.security.dto.RefreshRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "Đăng nhập / làm mới token")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository,
                           JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));

        User user = userRepository.findByUsernameAndActiveTrue(request.username())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Tài khoản không tồn tại hoặc đã bị khóa"));

        user.setLastLogin(Instant.now());
        userRepository.save(user);

        return toLoginResponse(user);
    }

    @PostMapping("/refresh")
    public LoginResponse refresh(@Valid @RequestBody RefreshRequest request) {
        String token = request.refreshToken();
        if (!jwtService.isValid(token) || !jwtService.isRefreshToken(token)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token không hợp lệ hoặc đã hết hạn");
        }

        String username = jwtService.extractUsername(token);
        User user = userRepository.findByUsernameAndActiveTrue(username)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Tài khoản không tồn tại hoặc đã bị khóa"));

        return toLoginResponse(user);
    }

    private LoginResponse toLoginResponse(User user) {
        return new LoginResponse(
                jwtService.generateAccessToken(user),
                jwtService.generateRefreshToken(user),
                "Bearer",
                jwtService.getAccessTokenExpiresInSeconds(),
                user.getUsername(),
                user.getFullName(),
                user.getRole().getCode());
    }
}
