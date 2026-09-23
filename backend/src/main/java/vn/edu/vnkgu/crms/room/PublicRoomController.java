package vn.edu.vnkgu.crms.room;

import vn.edu.vnkgu.crms.room.dto.RoomDto;
import vn.edu.vnkgu.crms.room.dto.SetupStyleDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public")
@Tag(name = "Public Rooms", description = "Xem phòng & danh mục (công khai, không cần đăng nhập)")
public class PublicRoomController {

    private final RoomService roomService;
    private final SetupStyleRepository setupStyleRepository;

    public PublicRoomController(RoomService roomService, SetupStyleRepository setupStyleRepository) {
        this.roomService = roomService;
        this.setupStyleRepository = setupStyleRepository;
    }

    @GetMapping("/rooms")
    public Page<RoomDto> list(@RequestParam(required = false) Integer floor,
                               @RequestParam(required = false) Integer minCapacity,
                               @RequestParam(required = false) String keyword,
                               Pageable pageable) {
        return roomService.list(floor, RoomStatus.ACTIVE, minCapacity, keyword, pageable);
    }

    @GetMapping("/rooms/{id}")
    public RoomDto get(@PathVariable Long id) {
        return roomService.get(id);
    }

    @GetMapping("/setup-styles")
    public List<SetupStyleDto> setupStyles() {
        return setupStyleRepository.findAll().stream().map(SetupStyleDto::from).toList();
    }
}
