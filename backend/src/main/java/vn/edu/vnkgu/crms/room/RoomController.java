package vn.edu.vnkgu.crms.room;

import vn.edu.vnkgu.crms.room.dto.RoomDto;
import vn.edu.vnkgu.crms.room.dto.RoomImageDto;
import vn.edu.vnkgu.crms.room.dto.RoomImageRequest;
import vn.edu.vnkgu.crms.room.dto.RoomRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rooms")
@Tag(name = "Rooms", description = "Quản lý phòng (admin)")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public Page<RoomDto> list(@RequestParam(required = false) Integer floor,
                               @RequestParam(required = false) RoomStatus status,
                               @RequestParam(required = false) Integer minCapacity,
                               @RequestParam(required = false) String keyword,
                               Pageable pageable) {
        return roomService.list(floor, status, minCapacity, keyword, pageable);
    }

    @GetMapping("/{id}")
    public RoomDto get(@PathVariable Long id) {
        return roomService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoomDto create(@Valid @RequestBody RoomRequest request) {
        return roomService.create(request);
    }

    @PutMapping("/{id}")
    public RoomDto update(@PathVariable Long id, @Valid @RequestBody RoomRequest request) {
        return roomService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        roomService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/images")
    @ResponseStatus(HttpStatus.CREATED)
    public RoomImageDto addImage(@PathVariable Long id, @Valid @RequestBody RoomImageRequest request) {
        return roomService.addImage(id, request);
    }

    @DeleteMapping("/{id}/images/{imageId}")
    public ResponseEntity<Void> removeImage(@PathVariable Long id, @PathVariable Long imageId) {
        roomService.removeImage(id, imageId);
        return ResponseEntity.noContent().build();
    }
}
