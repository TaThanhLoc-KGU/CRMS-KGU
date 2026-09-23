package vn.edu.vnkgu.crms.config.domain;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Every operational knob (lead-time, working hours, upload limits, SMTP, ...) is read
 * from the {@code configurations} table through here — never hardcoded in services.
 */
@Service
@Transactional(readOnly = true)
public class ConfigService {

    private final ConfigurationRepository repository;

    public ConfigService(ConfigurationRepository repository) {
        this.repository = repository;
    }

    public String getString(String key, String fallback) {
        return repository.findByKey(key).map(Configuration::getValue).filter(v -> !v.isBlank()).orElse(fallback);
    }

    public int getInt(String key, int fallback) {
        return repository.findByKey(key).map(Configuration::getValue)
                .filter(v -> !v.isBlank())
                .map(Integer::parseInt)
                .orElse(fallback);
    }

    public boolean getBoolean(String key, boolean fallback) {
        return repository.findByKey(key).map(Configuration::getValue)
                .filter(v -> !v.isBlank())
                .map(Boolean::parseBoolean)
                .orElse(fallback);
    }

    public List<String> getList(String key, List<String> fallback) {
        return repository.findByKey(key).map(Configuration::getValue)
                .filter(v -> !v.isBlank())
                .map(v -> Arrays.stream(v.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList())
                .orElse(fallback);
    }

    public LocalTime getTime(String key, LocalTime fallback) {
        return repository.findByKey(key).map(Configuration::getValue)
                .filter(v -> !v.isBlank())
                .map(LocalTime::parse)
                .orElse(fallback);
    }

    public List<Configuration> listAll() {
        return repository.findAll();
    }

    public Map<String, List<Configuration>> listGroupedAll() {
        return repository.findAll().stream().collect(Collectors.groupingBy(Configuration::getGroup));
    }

    @Transactional
    public void update(Map<String, String> values) {
        values.forEach((key, value) -> repository.findByKey(key).ifPresent(c -> c.setValue(value)));
    }
}
