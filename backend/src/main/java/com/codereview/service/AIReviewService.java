package com.codereview.service;

import com.codereview.entity.ReviewFinding;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Sends source code + static-analysis summary to an LLM and asks it to return
 * structured JSON findings, which get parsed into the same ReviewFinding shape
 * used by the static-analysis tools.
 *
 * Swappable provider: app.ai.provider / app.ai.base-url / app.ai.model in
 * application.properties. Gemini uses its native generateContent endpoint;
 * other providers can continue using OpenAI-compatible chat completions.
 */
@Service
public class AIReviewService {

    private final WebClient webClient;
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${app.ai.api-key}")
    private String apiKey;

    @Value("${app.ai.model}")
    private String model;

    @Value("${app.ai.provider:gemini}")
    private String provider;

    public AIReviewService(@Value("${app.ai.base-url}") String baseUrl) {
        this.webClient = WebClient.builder().baseUrl(baseUrl).build();
    }

    private static final String SYSTEM_PROMPT = """
            You are a senior Java code reviewer. Given source code and a summary of
            static-analysis results, identify additional bugs, code smells, security
            issues, performance problems, and refactoring opportunities that the
            static tools may have missed. Respond ONLY with a JSON array, no prose,
            no markdown fences. Each element must have exactly these fields:
            severity (CRITICAL|HIGH|MEDIUM|LOW|INFO), issue (short title),
            explanation (1-3 sentences), suggestion (concrete fix),
            fileName, lineNumber (integer, best guess, use 1 if unknown).
            """;

    public List<ReviewFinding> reviewCode(List<Path> sourceFiles, String staticAnalysisSummary) {
        List<ReviewFinding> findings = new ArrayList<>();
        try {
            String combinedSource = buildCombinedSource(sourceFiles);
            String userPrompt = "Static analysis summary:\n" + staticAnalysisSummary +
                    "\n\nSource code to review:\n" + combinedSource;

            String response = invokeModel(userPrompt);

            findings.addAll(parseAiResponse(response));
        } catch (WebClientResponseException.TooManyRequests e) {
            findings.add(ReviewFinding.builder()
                .severity(ReviewFinding.Severity.INFO)
                .source(ReviewFinding.Source.AI)
                .issue("AI review rate limited")
                .explanation("Gemini returned a 429 Too Many Requests response. Try again shortly, or reduce the review frequency/size if you are hitting quota limits.")
                .build());
        } catch (Exception e) {
            findings.add(ReviewFinding.builder()
                    .severity(ReviewFinding.Severity.INFO)
                    .source(ReviewFinding.Source.AI)
                    .issue("AI review unavailable")
                    .explanation("The AI review step failed: " + e.getMessage())
                    .build());
        }
        return findings;
    }

        private String invokeModel(String userPrompt) {
        if ("gemini".equalsIgnoreCase(provider)) {
            return invokeGeminiNative(userPrompt);
        }
        return invokeOpenAiCompatible(userPrompt);
        }

        private String invokeOpenAiCompatible(String userPrompt) {
        Map<String, Object> requestBody = Map.of(
            "model", model,
            "messages", List.of(
                Map.of("role", "system", "content", SYSTEM_PROMPT),
                Map.of("role", "user", "content", userPrompt)
            ),
            "temperature", 0.2
        );

        return webClient.post()
            .uri("/chat/completions")
            .header("Authorization", "Bearer " + apiKey)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(String.class)
            .block();
        }

        private String invokeGeminiNative(String userPrompt) {
        Map<String, Object> requestBody = Map.of(
            "systemInstruction", Map.of(
                "parts", List.of(Map.of("text", SYSTEM_PROMPT))
            ),
            "contents", List.of(
                Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", userPrompt))
                )
            ),
            "generationConfig", Map.of(
                "temperature", 0.2,
                "responseMimeType", "application/json"
            )
        );

        return webClient.post()
            .uri(uriBuilder -> uriBuilder
                .path("/models/{model}:generateContent")
                .queryParam("key", apiKey)
                .build(model))
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(String.class)
            .block();
        }

    private List<ReviewFinding> parseAiResponse(String rawResponse) throws Exception {
        JsonNode root = mapper.readTree(rawResponse);
        String content = "gemini".equalsIgnoreCase(provider)
            ? root.at("/candidates/0/content/parts/0/text").asText()
            : root.at("/choices/0/message/content").asText();

        // Defensive: strip markdown fences if the model added them despite instructions
        content = content.replaceAll("```json", "").replaceAll("```", "").trim();

        JsonNode arr = mapper.readTree(content);
        List<ReviewFinding> findings = new ArrayList<>();
        for (JsonNode node : arr) {
            findings.add(ReviewFinding.builder()
                    .severity(ReviewFinding.Severity.valueOf(node.path("severity").asText("INFO")))
                    .source(ReviewFinding.Source.AI)
                    .issue(node.path("issue").asText())
                    .explanation(node.path("explanation").asText())
                    .suggestion(node.path("suggestion").asText())
                    .fileName(node.path("fileName").asText(null))
                    .lineNumber(node.path("lineNumber").asInt(1))
                    .build());
        }
        return findings;
    }

    private String buildCombinedSource(List<Path> sourceFiles) throws Exception {
        StringBuilder sb = new StringBuilder();
        // Cap total size sent to the LLM to stay within context/cost limits;
        // for large projects, chunk per-file instead and merge results.
        int maxCharsPerFile = 4000;
        for (Path file : sourceFiles) {
            String content = Files.readString(file);
            if (content.length() > maxCharsPerFile) {
                content = content.substring(0, maxCharsPerFile) + "\n// ... truncated ...";
            }
            sb.append("// FILE: ").append(file.getFileName()).append("\n").append(content).append("\n\n");
        }
        return sb.toString();
    }
}
