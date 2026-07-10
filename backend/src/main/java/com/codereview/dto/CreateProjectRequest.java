package com.codereview.dto;

public record CreateProjectRequest(
        String projectName,
        String codeSnippet // used only when uploadType == SNIPPET; files come via multipart instead
) {}
