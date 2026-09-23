package vn.edu.vnkgu.crms.common.preview;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

/**
 * Short-lived signed URLs so an attachment preview can be embedded directly in an
 * &lt;iframe src&gt; (which can't carry an Authorization header) without exposing the
 * file to anyone who doesn't already have a valid admin session — see spec §11.4.
 */
@Service
public class PreviewTokenService {

    private final String secret;
    private final int ttlMinutes;

    public PreviewTokenService(@Value("${app.preview-token.secret}") String secret,
                                @Value("${app.preview-token.ttl-minutes}") int ttlMinutes) {
        this.secret = secret;
        this.ttlMinutes = ttlMinutes;
    }

    public String generate(Long bookingId, Long attachmentId) {
        long expiresAt = Instant.now().plusSeconds(ttlMinutes * 60L).getEpochSecond();
        String payload = bookingId + ":" + attachmentId + ":" + expiresAt;
        String signature = sign(payload);
        return base64(payload) + "." + signature;
    }

    public boolean isValid(Long bookingId, Long attachmentId, String token) {
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
        if (fields.length != 3) {
            return false;
        }
        try {
            long expiresAt = Long.parseLong(fields[2]);
            return fields[0].equals(String.valueOf(bookingId))
                    && fields[1].equals(String.valueOf(attachmentId))
                    && Instant.now().getEpochSecond() <= expiresAt;
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
