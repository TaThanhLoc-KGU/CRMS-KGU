package vn.edu.vnkgu.crms.common.storage;

import vn.edu.vnkgu.crms.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.Locale;

/**
 * Checks the real file format via magic bytes instead of trusting the client-supplied
 * extension/content-type. DOCX/XLSX (both zip containers) can't be told apart from an
 * arbitrary zip by magic bytes alone without unzipping and inspecting
 * {@code [Content_Types].xml} — out of scope here; the zip-signature check still
 * rejects anything that isn't even a zip pretending to be a .docx.
 */
@Component
public class FileValidator {

    public void validate(MultipartFile file, List<String> allowedExtensions, int maxSizeMb) {
        if (file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File rỗng: " + file.getOriginalFilename());
        }
        if (file.getSize() > (long) maxSizeMb * 1024 * 1024) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "File \"" + file.getOriginalFilename() + "\" vượt quá " + maxSizeMb + "MB");
        }

        String extension = extensionOf(file.getOriginalFilename());
        if (!allowedExtensions.contains(extension)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Định dạng \"" + extension + "\" không được phép. Cho phép: " + String.join(", ", allowedExtensions));
        }

        byte[] header = readHeader(file, 8);
        if (!matchesMagicBytes(extension, header)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "File \"" + file.getOriginalFilename() + "\" không đúng định dạng " + extension + " thật sự");
        }
    }

    private String extensionOf(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }

    private byte[] readHeader(MultipartFile file, int length) {
        try (var in = file.getInputStream()) {
            byte[] buf = new byte[length];
            int read = in.read(buf);
            return read <= 0 ? new byte[0] : java.util.Arrays.copyOf(buf, read);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private boolean matchesMagicBytes(String extension, byte[] header) {
        return switch (extension) {
            case "pdf" -> startsWith(header, 0x25, 0x50, 0x44, 0x46); // %PDF
            case "jpg", "jpeg" -> startsWith(header, 0xFF, 0xD8, 0xFF);
            case "png" -> startsWith(header, 0x89, 0x50, 0x4E, 0x47);
            case "doc" -> startsWith(header, 0xD0, 0xCF, 0x11, 0xE0); // OLE compound file
            case "docx", "xlsx" -> startsWith(header, 0x50, 0x4B, 0x03, 0x04); // zip container
            default -> true; // unknown-but-allowed extension: no known signature to check
        };
    }

    private boolean startsWith(byte[] header, int... expected) {
        if (header.length < expected.length) {
            return false;
        }
        for (int i = 0; i < expected.length; i++) {
            if ((header[i] & 0xFF) != expected[i]) {
                return false;
            }
        }
        return true;
    }
}
