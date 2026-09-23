package vn.edu.vnkgu.crms.common.storage;

import vn.edu.vnkgu.crms.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;

@Service
public class LocalDiskStorageService implements StorageService {

    private final Path root;

    public LocalDiskStorageService(@Value("${app.storage.root-path}") String rootPath) {
        this.root = Path.of(rootPath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new UncheckedIOException("Không thể tạo thư mục lưu trữ: " + root, e);
        }
    }

    @Override
    public StoredFile store(MultipartFile file, String subDirectory) {
        String extension = extensionOf(file.getOriginalFilename());
        // Renamed on save (per spec §15) — never trust the client-supplied filename for the path.
        String storedName = UUID.randomUUID() + (extension.isEmpty() ? "" : "." + extension);
        Path targetDir = resolveTargetDir(subDirectory);

        try {
            Path target = targetDir.resolve(storedName);
            file.transferTo(target);
            String relativePath = subDirectory + "/" + LocalDate.now() + "/" + storedName;
            return new StoredFile(relativePath, file.getOriginalFilename(), file.getContentType(), file.getSize());
        } catch (IOException e) {
            throw new UncheckedIOException("Không thể lưu file", e);
        }
    }

    @Override
    public String storeBytes(byte[] content, String fileName, String subDirectory) {
        String extension = extensionOf(fileName);
        String storedName = UUID.randomUUID() + (extension.isEmpty() ? "" : "." + extension);
        Path targetDir = resolveTargetDir(subDirectory);

        try {
            Path target = targetDir.resolve(storedName);
            Files.write(target, content);
            return subDirectory + "/" + LocalDate.now() + "/" + storedName;
        } catch (IOException e) {
            throw new UncheckedIOException("Không thể lưu file", e);
        }
    }

    private Path resolveTargetDir(String subDirectory) {
        String relativeDir = subDirectory + "/" + LocalDate.now();
        Path targetDir = root.resolve(relativeDir).normalize();
        if (!targetDir.startsWith(root)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Đường dẫn lưu trữ không hợp lệ");
        }
        try {
            Files.createDirectories(targetDir);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return targetDir;
    }

    @Override
    public Resource load(String storagePath) {
        Path target = root.resolve(storagePath).normalize();
        if (!target.startsWith(root)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Đường dẫn không hợp lệ");
        }
        if (!Files.exists(target)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy file");
        }
        return new FileSystemResource(target);
    }

    @Override
    public void delete(String storagePath) {
        Path target = root.resolve(storagePath).normalize();
        if (!target.startsWith(root)) {
            return;
        }
        try {
            Files.deleteIfExists(target);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private String extensionOf(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }
}
