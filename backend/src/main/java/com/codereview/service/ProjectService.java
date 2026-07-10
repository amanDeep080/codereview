package com.codereview.service;

import com.codereview.entity.Project;
import com.codereview.entity.Review;
import com.codereview.entity.User;
import com.codereview.repository.ProjectRepository;
import com.codereview.repository.ReviewRepository;
import com.codereview.util.FileUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.util.List;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ReviewRepository reviewRepository;
    private final ReviewOrchestrationService orchestrationService;

    public ProjectService(ProjectRepository projectRepository, ReviewRepository reviewRepository, ReviewOrchestrationService orchestrationService) {
        this.projectRepository = projectRepository;
        this.reviewRepository = reviewRepository;
        this.orchestrationService = orchestrationService;
    }

    @Value("${app.upload.dir}")
    private String uploadDir;

    /** Handles a single .java file or a .zip project upload; kicks off the async review pipeline. */
    public Review submitFileUpload(User user, String projectName, MultipartFile file) throws IOException {
        boolean isZip = file.getOriginalFilename() != null && file.getOriginalFilename().endsWith(".zip");
        Path projectDir = Path.of(uploadDir, user.getId().toString(), System.currentTimeMillis() + "_" + projectName);

        List<Path> sourceFiles;
        if (isZip) {
            FileUtils.extractZip(file.getInputStream(), projectDir);
            sourceFiles = FileUtils.collectSourceFiles(projectDir);
        } else {
            Files.createDirectories(projectDir);
            Path target = projectDir.resolve(file.getOriginalFilename());
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            sourceFiles = List.of(target);
        }

        Project project = Project.builder()
                .user(user)
                .projectName(projectName)
                .uploadType(isZip ? Project.UploadType.ZIP : Project.UploadType.FILE)
                .storagePath(projectDir.toString())
                .build();
        project = projectRepository.save(project);

        return kickOffReview(project, sourceFiles);
    }

    /** Handles a pasted code snippet - writes it to a temp .java file and reviews it the same way. */
    public Review submitSnippet(User user, String projectName, String codeSnippet) throws IOException {
        Path projectDir = Path.of(uploadDir, user.getId().toString(), System.currentTimeMillis() + "_" + projectName);
        Files.createDirectories(projectDir);

        // best-effort: extract public class name so the file compiles under that name
        String className = extractPublicClassName(codeSnippet).orElse("Snippet");
        Path target = projectDir.resolve(className + ".java");
        Files.writeString(target, codeSnippet, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

        Project project = Project.builder()
                .user(user)
                .projectName(projectName)
                .uploadType(Project.UploadType.SNIPPET)
                .storagePath(projectDir.toString())
                .build();
        project = projectRepository.save(project);

        return kickOffReview(project, List.of(target));
    }

    private Review kickOffReview(Project project, List<Path> sourceFiles) {
        Review review = Review.builder()
                .project(project)
                .status(Review.Status.PENDING)
                .build();
        review = reviewRepository.save(review);

        orchestrationService.runReviewPipeline(review.getId(), project, sourceFiles);
        return review;
    }

    private java.util.Optional<String> extractPublicClassName(String code) {
        var matcher = java.util.regex.Pattern.compile("public\\s+class\\s+(\\w+)").matcher(code);
        return matcher.find() ? java.util.Optional.of(matcher.group(1)) : java.util.Optional.empty();
    }

    public List<Project> listProjectsForUser(Long userId) {
        return projectRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
