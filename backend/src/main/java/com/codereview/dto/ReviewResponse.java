package com.codereview.dto;

import com.codereview.entity.Review;

import java.time.Instant;
import java.util.List;

public record ReviewResponse(
        Long id,
        Long projectId,
        Review.Status status,
        Integer reviewScore,
        String summary,
        Integer numClasses,
        Integer numMethods,
        Integer linesOfCode,
        Double averageMethodLength,
        Double cyclomaticComplexity,
        Double maintainabilityIndex,
        Instant createdAt,
        List<ReviewFindingDto> findings
) {}
