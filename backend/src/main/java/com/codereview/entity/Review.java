package com.codereview.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    public enum Status { PENDING, RUNNING_STATIC_ANALYSIS, RUNNING_AI_REVIEW, COMPLETED, FAILED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.PENDING;

    // 0-100 overall quality score derived from findings + complexity
    private Integer reviewScore;

    @Column(columnDefinition = "TEXT")
    private String summary;

    // --- complexity metrics (Stage: Complexity Analysis) ---
    private Integer numClasses;
    private Integer numMethods;
    private Integer linesOfCode;
    private Double averageMethodLength;
    private Double cyclomaticComplexity;
    private Double maintainabilityIndex;

    @Column(columnDefinition = "TEXT")
    private String errorMessage; // populated if status == FAILED

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<ReviewFinding> findings;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
