package vn.edu.vnkgu.crms.common.storage;

public record StoredFile(
        String storagePath,
        String originalFileName,
        String mimeType,
        long sizeBytes
) {
}
