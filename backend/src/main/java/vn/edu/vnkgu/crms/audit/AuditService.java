package vn.edu.vnkgu.crms.audit;

import vn.edu.vnkgu.crms.security.User;
// Spring Boot 4's own JSON stack is Jackson 3 (groupId tools.jackson.*, package
// tools.jackson.databind), a different major generation from the classic Jackson 2
// (com.fasterxml.jackson.*) that most docs/tutorials still assume. Only jjwt-jackson
// pulls in the 2.x line here (a transitive dep, unrelated to Spring's own ObjectMapper)
// — importing that one instead would fail bean injection with "no bean of type
// com.fasterxml.jackson.databind.ObjectMapper found" since Spring never creates it.
import tools.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;

/**
 * Deliberately a plain method call at each interesting write, not an AOP aspect —
 * explicit call sites are easier to verify ("did approve() actually log?") than
 * trusting a pointcut expression to match every method that should be audited.
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository repository;
    private final ObjectMapper objectMapper;

    public AuditService(AuditLogRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void log(User actor, String action, String entity, Long entityId, Map<String, Object> detail) {
        AuditLog entry = new AuditLog();
        entry.setUserId(actor != null ? actor.getId() : null);
        entry.setAction(action);
        entry.setEntity(entity);
        entry.setEntityId(entityId);
        entry.setIp(currentClientIp());
        try {
            entry.setDetail(detail != null ? objectMapper.writeValueAsString(detail) : null);
        } catch (Exception e) {
            log.warn("Failed to serialize audit detail for {} {}: {}", entity, entityId, e.getMessage());
        }
        repository.save(entry);
    }

    private String currentClientIp() {
        var attrs = RequestContextHolder.getRequestAttributes();
        if (!(attrs instanceof ServletRequestAttributes servletAttrs)) {
            return null;
        }
        HttpServletRequest request = servletAttrs.getRequest();
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
