package vn.edu.vnkgu.crms.common.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * Hides where files actually live. P1 only ships {@link LocalDiskStorageService};
 * a Nextcloud/MinIO-backed implementation can be swapped in later behind this same
 * interface without touching callers (BookingService, RoomService, ...).
 */
public interface StorageService {

    StoredFile store(MultipartFile file, String subDirectory);

    /** For derived artifacts (e.g. a Gotenberg-generated preview PDF) that aren't an uploaded MultipartFile. */
    String storeBytes(byte[] content, String fileName, String subDirectory);

    Resource load(String storagePath);

    void delete(String storagePath);
}
