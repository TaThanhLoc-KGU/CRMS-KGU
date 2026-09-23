package vn.edu.vnkgu.crms.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentCatalogRepository extends JpaRepository<EquipmentCatalog, Long> {
    List<EquipmentCatalog> findByActiveTrue();
}
