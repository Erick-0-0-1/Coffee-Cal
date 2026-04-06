package com.coffeecalculator.service;

import com.coffeecalculator.model.Recipe;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.util.Map;

@Service
public class PdfService {

    private final TemplateEngine templateEngine;
    private final PricingService pricingService;

    public PdfService(TemplateEngine templateEngine, PricingService pricingService) {
        this.templateEngine = templateEngine;
        this.pricingService = pricingService;
    }

    public byte[] generateRecipePdf(Recipe recipe, Map<String, Boolean> sections) {
        // Apply live pricing before generating PDF
        pricingService.applyLivePricing(recipe);

        Context context = new Context();
        context.setVariable("recipe", recipe);
        context.setVariable("sections", sections);

        String html = templateEngine.process("recipe-pdf", context);

        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, "classpath:/templates/");
            builder.toStream(os);
            builder.run();
            
            return os.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }
}
