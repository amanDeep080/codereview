package com.codereview.repository;

import com.codereview.entity.ReviewFinding;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewFindingRepository extends JpaRepository<ReviewFinding, Long> {
    List<ReviewFinding> findByReviewId(Long reviewId);
    List<ReviewFinding> findByReviewIdAndSeverity(Long reviewId, ReviewFinding.Severity severity);
}
