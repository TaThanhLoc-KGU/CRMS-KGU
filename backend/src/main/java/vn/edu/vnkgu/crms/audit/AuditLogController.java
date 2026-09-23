package vn.edu.vnkgu.crms.audit;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Audit Logs", description = "Nhật ký kiểm toán (chỉ Admin)")
public class AuditLogController {

    private final AuditLogRepository repository;

    public AuditLogController(AuditLogRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public Page<AuditLogDto> list(@RequestParam(required = false) String entity,
                                   @RequestParam(required = false) String action,
                                   Pageable pageable) {
        Specification<AuditLog> spec = Specification.allOf();
        if (entity != null && !entity.isBlank()) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("entity"), entity));
        }
        if (action != null && !action.isBlank()) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("action"), action));
        }
        return repository.findAll(spec, pageable).map(AuditLogDto::from);
    }
}
