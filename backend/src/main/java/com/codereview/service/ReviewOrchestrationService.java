package com.codereview.service;

import com.codereview.entity.Project;
import com.codereview.entity.Review;
import com.codereview.entity.ReviewFinding;
import com.codereview.repository.ReviewFindingRepository;
import com.codereview.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Runs the full pipeline (Stage 2 + Stage 3 from the spec) off the request
 * thread. Controller kicks this off and immediately returns a PENDING review;
 * the frontend polls GET /api/reviews/{id} until status == COMPLETED|FAILED.
 */
@Service
@Slf4j
public class ReviewOrchestrationService {

    private final ReviewRepository reviewRepository;
    private final ReviewFindingRepository findingRepository;
    private final StaticAnalysisService staticAnalysisService;
    private final ComplexityAnalysisService complexityAnalysisService;
    private final AIReviewService aiReviewService;

    public ReviewOrchestrationService(ReviewRepository reviewRepository, ReviewFindingRepository findingRepository, StaticAnalysisService staticAnalysisService, ComplexityAnalysisService complexityAnalysisService, AIReviewService aiReviewService) {
        this.reviewRepository = reviewRepository;
        this.findingRepository = findingRepository;
        this.staticAnalysisService = staticAnalysisService;
        this.complexityAnalysisService = complexityAnalysisService;
        this.aiReviewService = aiReviewService;
    }

    @Async
    public void runReviewPipeline(Long reviewId, Project project, List<Path> sourceFiles) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalStateException("Review not found: " + reviewId));

        try {
            // --- Stage 2: Static Analysis ---
            review.setStatus(Review.Status.RUNNING_STATIC_ANALYSIS);
            reviewRepository.save(review);

            Path projectRoot = Path.of(project.getStoragePath());
            List<ReviewFinding> staticFindings = new ArrayList<>();
            staticFindings.addAll(staticAnalysisService.runCheckstyle(projectRoot, sourceFiles));
            staticFindings.addAll(staticAnalysisService.runPmd(projectRoot));
            // SpotBugs skipped by default - needs a compile step, see StaticAnalysisService javadoc

            var metrics = complexityAnalysisService.analyze(sourceFiles);

            // --- Stage 3: AI Review ---
            review.setStatus(Review.Status.RUNNING_AI_REVIEW);
            reviewRepository.save(review);

            String staticSummary = summarize(staticFindings);
            List<ReviewFinding> aiFindings = aiReviewService.reviewCode(sourceFiles, staticSummary);

            // --- Persist findings ---
            List<ReviewFinding> allFindings = new ArrayList<>();
            allFindings.addAll(staticFindings);
            allFindings.addAll(aiFindings);
            allFindings.forEach(f -> f.setReview(review));
            findingRepository.saveAll(allFindings);

            // --- Finalize review record ---
            review.setNumClasses(metrics.numClasses());
            review.setNumMethods(metrics.numMethods());
            review.setLinesOfCode(metrics.linesOfCode());
            review.setAverageMethodLength(metrics.averageMethodLength());
            review.setCyclomaticComplexity(metrics.cyclomaticComplexity());
            review.setMaintainabilityIndex(metrics.maintainabilityIndex());
            review.setReviewScore(computeScore(allFindings, metrics.maintainabilityIndex()));
            review.setSummary(buildSummary(allFindings, metrics));
            review.setStatus(Review.Status.COMPLETED);
            reviewRepository.save(review);

        } catch (Exception e) {
            log.error("Review pipeline failed for review {}", reviewId, e);
            review.setStatus(Review.Status.FAILED);
            review.setErrorMessage(e.getMessage());
            reviewRepository.save(review);
        }
    }

    private String summarize(List<ReviewFinding> findings) {
        if (findings.isEmpty()) return "No static-analysis issues found.";
        Map<ReviewFinding.Severity, Long> counts = findings.stream()
                .collect(Collectors.groupingBy(ReviewFinding::getSeverity, Collectors.counting()));
        return counts.entrySet().stream()
                .map(e -> e.getKey() + ": " + e.getValue())
                .collect(Collectors.joining(", "));
    }

    /** Simple weighted score: starts at 100, subtract per finding by severity, floor at 0. */
    private int computeScore(List<ReviewFinding> findings, double maintainabilityIndex) {
        int score = 100;
        for (ReviewFinding f : findings) {
            score -= switch (f.getSeverity()) {
                case CRITICAL -> 15;
                case HIGH -> 8;
                case MEDIUM -> 4;
                case LOW -> 1;
                case INFO -> 0;
            };
        }
        // blend in maintainability index so complexity also affects the score
        score = (int) Math.round(score * 0.7 + maintainabilityIndex * 0.3);
        return Math.max(0, Math.min(100, score));
    }

    private String buildSummary(List<ReviewFinding> findings, ComplexityAnalysisService.ComplexityMetrics metrics) {
        long critical = findings.stream().filter(f -> f.getSeverity() == ReviewFinding.Severity.CRITICAL).count();
        long high = findings.stream().filter(f -> f.getSeverity() == ReviewFinding.Severity.HIGH).count();
        return String.format(
                "Analyzed %d classes / %d methods (%d LOC). %d critical and %d high-severity issues found. " +
                "Average cyclomatic complexity: %.1f. Maintainability index: %.0f/100.",
                metrics.numClasses(), metrics.numMethods(), metrics.linesOfCode(),
                critical, high, metrics.cyclomaticComplexity(), metrics.maintainabilityIndex()
        );
    }
}
