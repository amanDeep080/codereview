package com.codereview.dto;

import com.codereview.entity.ReviewFinding;

public record ReviewFindingDto(
        Long id,
        ReviewFinding.Severity severity,
        ReviewFinding.Source source,
        String issue,
        String explanation,
        String suggestion,
        String fileName,
        Integer lineNumber
) {
    public static ReviewFindingDto from(ReviewFinding f) {
        return new ReviewFindingDto(
                f.getId(), f.getSeverity(), f.getSource(), f.getIssue(),
                f.getExplanation(), f.getSuggestion(), f.getFileName(), f.getLineNumber()
        );
    }
}
