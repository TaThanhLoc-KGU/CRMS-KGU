package vn.edu.vnkgu.crms.handover;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

/**
 * Signed tokens embedded in a handover slip's printed QR code, so scanning it can
 * hit a public confirm endpoint (no JWT — the scanning device is a random phone
 * camera, not a logged-in admin session) without letting anyone confirm an
 * arbitrary slip by guessing its id. Same HMAC pattern as
 * {@link vn.edu.vnkgu.crms.common.preview.PreviewTokenService}, kept as a separate
 * class because the two tokens protect different resources with different TTLs
 * (a preview link is meant to expire in minutes; a slip is printed on paper and
 * may be scanned any time during the physical borrow/return, so it needs months).
 */
@Service
public class HandoverConfirmTokenService {

    private final String secret;
    private final int ttlDays;

    public HandoverConfirmTokenService(@Value("${app.handover-confirm-token.secret}") String secret,
                                        @Value("${app.handover-confirm-token.ttl-days}") int ttlDays) {
        this.secret = secret;
        this.ttlDays = ttlDays;
    }

    public String generate(Long slipId) {
        long expiresAt = Instant.now().plusSeconds(ttlDays * 24L * 3600).getEpochSecond();
        String payload = slipId + ":" + expiresAt;
        return base64(payload) + "." + sign(payload);
    }

    public boolean isValid(Long slipId, String token) {
        if (token == null || !token.contains(".")) {
            return false;
        }
        String[] parts = token.split("\\.", 2);
        String payload;
        try {
            payload = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return false;
        }
        if (!sign(payload).equals(parts[1])) {
            return false;
        }
        String[] fields = payload.split(":");
        if (fields.length != 2) {
            return false;
        }
        try {
            long expiresAt = Long.parseLong(fields[1]);
            return fields[0].equals(String.valueOf(slipId)) && Instant.now().getEpochSecond() <= expiresAt;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private String base64(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }
}
