package com.coffeecalculator.service;

import com.coffeecalculator.model.Recipe;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.util.Map;

@Service
public class PdfService {

    private static final Logger logger = LoggerFactory.getLogger(PdfService.class);
    private final TemplateEngine templateEngine;
    private final PricingService pricingService;

    public PdfService(TemplateEngine templateEngine, PricingService pricingService) {
        this.templateEngine = templateEngine;
        this.pricingService = pricingService;
    }

    public byte[] generateRecipePdf(Recipe recipe, Map<String, Boolean> sections) {
        try {
            // Apply live pricing before generating PDF
            pricingService.applyLivePricing(recipe);

            Context context = new Context();
            context.setVariable("recipe", recipe);
            context.setVariable("sections", sections);

            // 1. Process the Thymeleaf template into an HTML string
            String html = templateEngine.process("recipe-pdf", context);

            // 2. Generate the PDF
            try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
                PdfRendererBuilder builder = new PdfRendererBuilder();
                builder.useFastMode();
                
                // ✅ FIX: Use a safe base URI. "classpath:/templates/" often breaks inside Render JARs.
                // Using null prevents the library from crashing when it scans for external assets.
                builder.withHtmlContent(html, null); 
                
                builder.toStream(os);
                builder.run();
                
                return os.toByteArray();
            }
        } catch (Exception e) {
            // ✅ FIX: Print the EXACT error to your Render logs so it is no longer a mystery!
            logger.error("CRITICAL ERROR generating PDF for Recipe ID {}: {}", recipe.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to generate PDF: " + e.getMessage(), e);
        }
    }
}