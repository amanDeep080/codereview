package com.codereview.service;

import com.codereview.dto.ReviewFindingDto;
import com.codereview.dto.ReviewResponse;
import com.codereview.entity.Review;
import com.codereview.exception.ApiException;
import com.codereview.repository.ReviewFindingRepository;
import com.codereview.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewFindingRepository findingRepository;

    public ReviewService(ReviewRepository reviewRepository, ReviewFindingRepository findingRepository) {
        this.reviewRepository = reviewRepository;
        this.findingRepository = findingRepository;
    }

    public ReviewResponse getReview(Long reviewId, Long requestingUserId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> ApiException.notFound("Review not found"));

        if (!review.getProject().getUser().getId().equals(requestingUserId)) {
            throw ApiException.unauthorized("You do not have access to this review");
        }

        List<ReviewFindingDto> findings = findingRepository.findByReviewId(reviewId).stream()
                .map(ReviewFindingDto::from)
                .toList();

        return toResponse(review, findings);
    }

    public List<ReviewResponse> listReviewsForUser(Long userId) {
        return reviewRepository.findByProject_User_IdOrderByCreatedAtDesc(userId).stream()
                .map(r -> toResponse(r, List.of())) // dashboard list view - findings loaded lazily on detail view
                .toList();
    }

    public void deleteReview(Long reviewId, Long requestingUserId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> ApiException.notFound("Review not found"));
        if (!review.getProject().getUser().getId().equals(requestingUserId)) {
            throw ApiException.unauthorized("You do not have access to this review");
        }
        reviewRepository.delete(review);
    }

    private ReviewResponse toResponse(Review r, List<ReviewFindingDto> findings) {
        return new ReviewResponse(
                r.getId(), r.getProject().getId(), r.getStatus(), r.getReviewScore(), r.getSummary(),
                r.getNumClasses(), r.getNumMethods(), r.getLinesOfCode(),
                r.getAverageMethodLength(), r.getCyclomaticComplexity(), r.getMaintainabilityIndex(),
                r.getCreatedAt(), findings
        );
    }
}
