package vn.edu.vnkgu.crms.config.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConfigurationRepository extends JpaRepository<Configuration, String> {
    List<Configuration> findByGroup(String group);

    Optional<Configuration> findByKey(String key);
}
