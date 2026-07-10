package com.codereview.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "projects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    public enum UploadType { FILE, ZIP, SNIPPET }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String projectName;

    @Enumerated(EnumType.STRING)
    private UploadType uploadType;

    // path on disk (under app.upload.dir) where the extracted/stored source lives
    private String storagePath;

    @Builder.Default
    private Instant createdAt = Instant.now();
}
