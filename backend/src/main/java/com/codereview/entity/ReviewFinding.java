package com.codereview.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "review_findings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewFinding {

    public enum Severity { CRITICAL, HIGH, MEDIUM, LOW, INFO }
    public enum Source { CHECKSTYLE, PMD, SPOTBUGS, AI }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @Enumerated(EnumType.STRING)
    private Severity severity;

    @Enumerated(EnumType.STRING)
    private Source source;

    @Column(nullable = false)
    private String issue; // short title, e.g. "Unused variable"

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(columnDefinition = "TEXT")
    private String suggestion;

    private String fileName;

    private Integer lineNumber;
}
