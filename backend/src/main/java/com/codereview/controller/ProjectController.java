package com.codereview.controller;

import com.codereview.entity.Project;
import com.codereview.entity.Review;
import com.codereview.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    /** Upload a single .java file or a .zip project. Kicks off the async review pipeline. */
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<Review> upload(
            @RequestParam("projectName") String projectName,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        Review review = projectService.submitFileUpload(CurrentUser.get(), projectName, file);
        return ResponseEntity.accepted().body(review); // 202: pipeline runs async, poll GET /reviews/{id}
    }

    /** Submit a pasted code snippet instead of a file. */
    @PostMapping("/snippet")
    public ResponseEntity<Review> submitSnippet(@RequestBody Map<String, String> body) throws IOException {
        String projectName = body.getOrDefault("projectName", "Untitled snippet");
        String code = body.get("codeSnippet");
        Review review = projectService.submitSnippet(CurrentUser.get(), projectName, code);
        return ResponseEntity.accepted().body(review);
    }

    @GetMapping
    public ResponseEntity<List<Project>> listProjects() {
        return ResponseEntity.ok(projectService.listProjectsForUser(CurrentUser.get().getId()));
    }
}
