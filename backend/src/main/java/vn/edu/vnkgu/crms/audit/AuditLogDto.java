package vn.edu.vnkgu.crms.audit;

import java.time.Instant;

public record AuditLogDto(
        Long id,
        Long userId,
        String action,
        String entity,
        Long entityId,
        String detail,
        String ip,
        Instant createdAt
) {
    public static AuditLogDto from(AuditLog log) {
        return new AuditLogDto(log.getId(), log.getUserId(), log.getAction(), log.getEntity(), log.getEntityId(),
                log.getDetail(), log.getIp(), log.getCreatedAt());
    }
}
