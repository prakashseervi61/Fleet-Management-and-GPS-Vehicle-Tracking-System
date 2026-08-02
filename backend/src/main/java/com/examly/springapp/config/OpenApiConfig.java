package com.examly.springapp.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

 


@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI fleetManagementOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Fleet Management and GPS Vehicle Tracking System API")
                        .description("REST API for vehicle registration, GPS tracking, trip assignment, "
                                + "driver behaviour monitoring, preventive maintenance, fuel and compliance management.")
                        .version("1.0.0")
                        .contact(new Contact().name("Fleet Management Development Team")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components().addSecuritySchemes("bearerAuth",
                        new SecurityScheme()
                                .name("bearerAuth")
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
