package vn.edu.vnkgu.crms.room;

import vn.edu.vnkgu.crms.common.NotFoundException;
import vn.edu.vnkgu.crms.room.dto.SetupStyleDto;
import vn.edu.vnkgu.crms.room.dto.SetupStyleRequest;
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
@RequestMapping("/api/v1/setup-styles")
@Tag(name = "Setup Styles", description = "Danh mục kiểu bố trí (admin)")
public class SetupStyleController {

    private final SetupStyleRepository repository;

    public SetupStyleController(SetupStyleRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<SetupStyleDto> list() {
        return repository.findAll().stream().map(SetupStyleDto::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SetupStyleDto create(@Valid @RequestBody SetupStyleRequest request) {
        SetupStyle style = new SetupStyle();
        apply(style, request);
        return SetupStyleDto.from(repository.save(style));
    }

    @PutMapping("/{id}")
    public SetupStyleDto update(@PathVariable Long id, @Valid @RequestBody SetupStyleRequest request) {
        SetupStyle style = repository.findById(id).orElseThrow(() -> NotFoundException.of("Kiểu bố trí", id));
        apply(style, request);
        return SetupStyleDto.from(repository.save(style));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void apply(SetupStyle style, SetupStyleRequest request) {
        style.setCode(request.code());
        style.setName(request.name());
        style.setDescription(request.description());
        style.setIcon(request.icon());
    }
}
