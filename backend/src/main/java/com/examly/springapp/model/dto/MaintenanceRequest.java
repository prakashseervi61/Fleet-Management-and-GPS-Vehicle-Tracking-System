package com.examly.springapp.model.dto;

import com.examly.springapp.model.MaintenanceOrder;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

 


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceRequest {

    @NotNull(message = "Vehicle id is required")
    private Long vehicleId;

    @NotBlank(message = "Service type is required")
    private String serviceType;

    private String trigger;

    private LocalDate scheduledDate;

    @Positive(message = "Cost must be positive")
    private BigDecimal cost;

    public MaintenanceOrder.MaintenanceTrigger resolveTrigger() {
        if (trigger == null || trigger.isBlank()) {
            return MaintenanceOrder.MaintenanceTrigger.SCHEDULE;
        }
        return MaintenanceOrder.MaintenanceTrigger.valueOf(trigger.trim().toUpperCase());
    }
}
