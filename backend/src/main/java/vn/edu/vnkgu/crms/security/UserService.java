package vn.edu.vnkgu.crms.security;

import vn.edu.vnkgu.crms.common.ConflictException;
import vn.edu.vnkgu.crms.common.NotFoundException;
import vn.edu.vnkgu.crms.security.dto.UserCreateRequest;
import vn.edu.vnkgu.crms.security.dto.UserDto;
import vn.edu.vnkgu.crms.security.dto.UserUpdateRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.vnkgu.crms.common.ApiException;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserDto> list() {
        return userRepository.findAll().stream().map(UserDto::from).toList();
    }

    @Transactional
    public UserDto create(UserCreateRequest request) {
        if (userRepository.findByUsernameAndActiveTrue(request.username()).isPresent()) {
            throw new ConflictException("Tên đăng nhập đã tồn tại: " + request.username());
        }
        Role role = roleRepository.findByCode(request.roleCode().toUpperCase())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ: " + request.roleCode()));

        User user = new User();
        user.setUsername(request.username());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setUnit(request.unit());
        user.setRole(role);
        user.setActive(true);
        return UserDto.from(userRepository.save(user));
    }

    @Transactional
    public UserDto update(Long id, UserUpdateRequest request) {
        User user = getEntity(id);
        Role role = roleRepository.findByCode(request.roleCode().toUpperCase())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ: " + request.roleCode()));
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setUnit(request.unit());
        user.setRole(role);
        user.setActive(request.active());
        return UserDto.from(userRepository.saveAndFlush(user));
    }

    @Transactional
    public void resetPassword(Long id, String newPassword) {
        User user = getEntity(id);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private User getEntity(Long id) {
        return userRepository.findById(id).orElseThrow(() -> NotFoundException.of("Người dùng", id));
    }
}
