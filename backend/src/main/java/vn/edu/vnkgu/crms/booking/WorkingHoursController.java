package vn.edu.vnkgu.crms.booking;

import vn.edu.vnkgu.crms.common.NotFoundException;
import vn.edu.vnkgu.crms.booking.dto.WorkingHoursDto;
import vn.edu.vnkgu.crms.booking.dto.WorkingHoursRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/working-hours")
@Tag(name = "Working Hours", description = "Giờ làm việc theo ngày trong tuần (admin)")
public class WorkingHoursController {

    private final WorkingHoursRepository repository;

    public WorkingHoursController(WorkingHoursRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<WorkingHoursDto> list() {
        return repository.findAll().stream()
                .sorted((a, b) -> Integer.compare(a.getDayOfWeek(), b.getDayOfWeek()))
                .map(WorkingHoursDto::from).toList();
    }

    @PutMapping("/{dayOfWeek}")
    public WorkingHoursDto update(@PathVariable int dayOfWeek, @Valid @RequestBody WorkingHoursRequest request) {
        WorkingHours hours = repository.findByDayOfWeek(dayOfWeek)
                .orElseThrow(() -> new NotFoundException("Không có cấu hình cho ngày " + dayOfWeek));
        hours.setStartTime(request.startTime());
        hours.setEndTime(request.endTime());
        hours.setWorkingDay(request.workingDay());
        return WorkingHoursDto.from(repository.save(hours));
    }
}
