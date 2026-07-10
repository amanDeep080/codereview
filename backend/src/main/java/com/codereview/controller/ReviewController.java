package com.codereview.controller;

import com.codereview.dto.ReviewResponse;
import com.codereview.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    /** Frontend polls this until status == COMPLETED|FAILED after a submit call. */
    @GetMapping("/{id}")
    public ResponseEntity<ReviewResponse> getReview(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.getReview(id, CurrentUser.get().getId()));
    }

    /** Dashboard: view all past reviews. Search/filter (by score, date, project name)
     *  can be added as @RequestParam predicates here without changing the response shape. */
    @GetMapping
    public ResponseEntity<List<ReviewResponse>> listReviews() {
        return ResponseEntity.ok(reviewService.listReviewsForUser(CurrentUser.get().getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id, CurrentUser.get().getId());
        return ResponseEntity.noContent().build();
    }

    // TODO: GET /{id}/export?format=pdf|html|markdown -> wire to a ReportExportService using OpenPDF
}
