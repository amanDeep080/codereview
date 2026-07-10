package com.codereview.repository;

import com.codereview.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    // backs the dashboard's "search/filter reviews" feature
    List<Review> findByProject_User_IdOrderByCreatedAtDesc(Long userId);
}
