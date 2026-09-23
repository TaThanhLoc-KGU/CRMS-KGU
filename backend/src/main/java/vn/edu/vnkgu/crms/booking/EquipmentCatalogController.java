package vn.edu.vnkgu.crms.booking;

import vn.edu.vnkgu.crms.common.NotFoundException;
import vn.edu.vnkgu.crms.booking.dto.EquipmentCatalogDto;
import vn.edu.vnkgu.crms.booking.dto.EquipmentCatalogRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/v1/equipments")
@Tag(name = "Equipment Catalog", description = "Danh mục thiết bị mượn thêm (admin)")
public class EquipmentCatalogController {

    private final EquipmentCatalogRepository repository;

    public EquipmentCatalogController(EquipmentCatalogRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<EquipmentCatalogDto> list() {
        return repository.findAll().stream().map(EquipmentCatalogDto::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EquipmentCatalogDto create(@Valid @RequestBody EquipmentCatalogRequest request) {
        EquipmentCatalog equipment = new EquipmentCatalog();
        apply(equipment, request);
        return EquipmentCatalogDto.from(repository.save(equipment));
    }

    @PutMapping("/{id}")
    public EquipmentCatalogDto update(@PathVariable Long id, @Valid @RequestBody EquipmentCatalogRequest request) {
        EquipmentCatalog equipment = repository.findById(id).orElseThrow(() -> NotFoundException.of("Thiết bị", id));
        apply(equipment, request);
        return EquipmentCatalogDto.from(repository.save(equipment));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void apply(EquipmentCatalog equipment, EquipmentCatalogRequest request) {
        equipment.setCode(request.code());
        equipment.setName(request.name());
        equipment.setUnit(request.unit());
        equipment.setShared(Boolean.TRUE.equals(request.shared()));
        equipment.setDefaultQuantity(request.defaultQuantity() != null ? request.defaultQuantity() : 1);
        equipment.setActive(request.active() == null || request.active());
    }
}
