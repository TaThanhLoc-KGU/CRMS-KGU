package vn.edu.vnkgu.crms.booking;

import vn.edu.vnkgu.crms.common.NotFoundException;
import vn.edu.vnkgu.crms.booking.dto.PublicHolidayDto;
import vn.edu.vnkgu.crms.booking.dto.PublicHolidayRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/holidays")
@Tag(name = "Holidays", description = "Ngày nghỉ lễ (admin)")
public class PublicHolidayController {

    private final PublicHolidayRepository repository;

    public PublicHolidayController(PublicHolidayRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<PublicHolidayDto> list() {
        return repository.findAll().stream().map(PublicHolidayDto::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PublicHolidayDto create(@Valid @RequestBody PublicHolidayRequest request) {
        PublicHoliday holiday = new PublicHoliday();
        holiday.setHolidayDate(request.holidayDate());
        holiday.setName(request.name());
        return PublicHolidayDto.from(repository.save(holiday));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw NotFoundException.of("Ngày nghỉ lễ", id);
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
