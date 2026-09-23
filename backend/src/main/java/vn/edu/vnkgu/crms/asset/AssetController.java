package vn.edu.vnkgu.crms.asset;

import vn.edu.vnkgu.crms.asset.dto.AssetDto;
import vn.edu.vnkgu.crms.asset.dto.AssetRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Assets", description = "Tài sản/thiết bị trong phòng (admin)")
public class AssetController {

    private final AssetService assetService;

    public AssetController(AssetService assetService) {
        this.assetService = assetService;
    }

    @GetMapping("/rooms/{roomId}/assets")
    public List<AssetDto> listByRoom(@PathVariable Long roomId) {
        return assetService.listByRoom(roomId);
    }

    @GetMapping("/rooms/{roomId}/assets/export")
    public ResponseEntity<byte[]> exportByRoom(@PathVariable Long roomId) {
        byte[] excel = assetService.exportByRoom(roomId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=kiem-ke-tai-san.xlsx")
                .body(excel);
    }

    @PostMapping("/rooms/{roomId}/assets")
    @ResponseStatus(HttpStatus.CREATED)
    public AssetDto create(@PathVariable Long roomId, @Valid @RequestBody AssetRequest request) {
        return assetService.create(roomId, request);
    }

    @GetMapping("/assets/{id}")
    public AssetDto get(@PathVariable Long id) {
        return assetService.get(id);
    }

    @PutMapping("/assets/{id}")
    public AssetDto update(@PathVariable Long id, @Valid @RequestBody AssetRequest request) {
        return assetService.update(id, request);
    }

    @DeleteMapping("/assets/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        assetService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
