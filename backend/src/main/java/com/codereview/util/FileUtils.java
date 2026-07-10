package com.codereview.util;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class FileUtils {

    // Stage 1: File Processing — only these are relevant to a Java code review
    private static final Set<String> SUPPORTED_EXTENSIONS = Set.of(".java");

    // build folders / dependency folders / VCS dirs to ignore during scanning
    private static final Set<String> IGNORED_DIR_NAMES = Set.of(
            "target", "build", ".git", "node_modules", ".idea", ".gradle", "out", "bin"
    );

    /**
     * Extracts an uploaded ZIP into destDir, skipping build/dependency folders
     * and any zip-slip path traversal attempts.
     */
    public static void extractZip(InputStream zipStream, Path destDir) throws IOException {
        Files.createDirectories(destDir);
        try (ZipInputStream zis = new ZipInputStream(zipStream)) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                Path target = destDir.resolve(entry.getName()).normalize();

                // zip-slip protection: reject entries that escape destDir
                if (!target.startsWith(destDir)) {
                    continue;
                }
                if (shouldIgnore(target)) {
                    continue;
                }
                if (entry.isDirectory()) {
                    Files.createDirectories(target);
                } else {
                    Files.createDirectories(target.getParent());
                    Files.copy(zis, target, StandardCopyOption.REPLACE_EXISTING);
                }
            }
        }
    }

    private static boolean shouldIgnore(Path path) {
        for (Path part : path) {
            if (IGNORED_DIR_NAMES.contains(part.toString())) {
                return true;
            }
        }
        return false;
    }

    /** Recursively collects all supported (.java) source files under a root, ignoring build/dependency dirs. */
    public static List<Path> collectSourceFiles(Path root) throws IOException {
        try (Stream<Path> walk = Files.walk(root)) {
            return walk
                    .filter(Files::isRegularFile)
                    .filter(p -> !shouldIgnore(p))
                    .filter(p -> SUPPORTED_EXTENSIONS.stream().anyMatch(ext -> p.toString().endsWith(ext)))
                    .collect(Collectors.toList());
        }
    }
}
