package vn.edu.vnkgu.crms.room;

import vn.edu.vnkgu.crms.common.ConflictException;
import vn.edu.vnkgu.crms.common.NotFoundException;
import vn.edu.vnkgu.crms.room.dto.RoomDto;
import vn.edu.vnkgu.crms.room.dto.RoomImageDto;
import vn.edu.vnkgu.crms.room.dto.RoomImageRequest;
import vn.edu.vnkgu.crms.room.dto.RoomRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomImageRepository roomImageRepository;

    public RoomService(RoomRepository roomRepository, RoomImageRepository roomImageRepository) {
        this.roomRepository = roomRepository;
        this.roomImageRepository = roomImageRepository;
    }

    public Page<RoomDto> list(Integer floor, RoomStatus status, Integer minCapacity, String keyword,
                               Pageable pageable) {
        Specification<Room> spec = Specification.allOf();
        if (floor != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("floor"), floor));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (minCapacity != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("capacity"), minCapacity));
        }
        if (keyword != null && !keyword.isBlank()) {
            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("code")), pattern)));
        }
        return roomRepository.findAll(spec, pageable).map(RoomDto::from);
    }

    public RoomDto get(Long id) {
        return RoomDto.from(getEntity(id));
    }

    @Transactional
    public RoomDto create(RoomRequest request) {
        if (roomRepository.existsByCode(request.code())) {
            throw new ConflictException("Mã phòng đã tồn tại: " + request.code());
        }
        Room room = new Room();
        applyRequest(room, request);
        return RoomDto.from(roomRepository.save(room));
    }

    @Transactional
    public RoomDto update(Long id, RoomRequest request) {
        Room room = getEntity(id);
        if (roomRepository.existsByCodeAndIdNot(request.code(), id)) {
            throw new ConflictException("Mã phòng đã tồn tại: " + request.code());
        }
        applyRequest(room, request);
        // saveAndFlush (not save): @UpdateTimestamp only populates updatedAt when the
        // UPDATE actually executes, which Hibernate would otherwise defer to commit time,
        // after this method — and the DTO below — has already been built.
        return RoomDto.from(roomRepository.saveAndFlush(room));
    }

    @Transactional
    public void delete(Long id) {
        Room room = getEntity(id);
        roomRepository.delete(room);
    }

    @Transactional
    public RoomImageDto addImage(Long roomId, RoomImageRequest request) {
        Room room = getEntity(roomId);
        RoomImage image = new RoomImage();
        image.setRoom(room);
        image.setUrl(request.url());
        image.setCaption(request.caption());
        image.setSortOrder(request.sortOrder() != null ? request.sortOrder() : room.getImages().size());
        // Persisted directly on the child repository (not cascaded through the already-managed
        // Room): save() on an existing Room goes through merge(), and merge() never mutates a
        // cascaded *new* child in place — it copies it onto a separate managed instance, so the
        // generated id would never reach this `image` reference. persist() (the isNew() branch
        // save() takes for a transient entity) does mutate it directly.
        roomImageRepository.saveAndFlush(image);
        return RoomImageDto.from(image);
    }

    @Transactional
    public void removeImage(Long roomId, Long imageId) {
        Room room = getEntity(roomId);
        RoomImage image = roomImageRepository.findById(imageId)
                .orElseThrow(() -> NotFoundException.of("Ảnh phòng", imageId));
        if (!image.getRoom().getId().equals(room.getId())) {
            throw new NotFoundException("Ảnh không thuộc phòng này");
        }
        room.getImages().remove(image);
        roomRepository.save(room);
    }

    private Room getEntity(Long id) {
        return roomRepository.findById(id).orElseThrow(() -> NotFoundException.of("Phòng", id));
    }

    private void applyRequest(Room room, RoomRequest request) {
        room.setCode(request.code());
        room.setName(request.name());
        room.setBuilding(request.building());
        room.setFloor(request.floor());
        room.setCapacity(request.capacity());
        room.setAreaM2(request.areaM2());
        room.setDescription(request.description());
        room.setThumbnailUrl(request.thumbnailUrl());
        room.setStatus(request.status() != null ? request.status() : RoomStatus.ACTIVE);
        room.setMinLeadHoursOverride(request.minLeadHoursOverride());
    }
}
