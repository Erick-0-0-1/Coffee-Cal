package com.coffeecalculator.repository;

import com.coffeecalculator.model.BusinessSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BusinessSettingsRepository extends JpaRepository<BusinessSettings, Long> {

    /**
     * Get the current business settings (should only be one record)
     */
    @Query("SELECT bs FROM BusinessSettings bs ORDER BY bs.id DESC")
    Optional<BusinessSettings> findLatestSettings();
}