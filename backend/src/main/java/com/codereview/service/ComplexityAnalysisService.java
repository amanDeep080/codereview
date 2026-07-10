package com.codereview.service;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.MethodDeclaration;
import com.github.javaparser.ast.stmt.*;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@Service
public class ComplexityAnalysisService {

    public record ComplexityMetrics(
            int numClasses, int numMethods, int linesOfCode,
            double averageMethodLength, double cyclomaticComplexity, double maintainabilityIndex
    ) {}

    public ComplexityMetrics analyze(List<Path> sourceFiles) {
        int totalClasses = 0, totalMethods = 0, totalLoc = 0, totalMethodLines = 0;
        double totalComplexity = 0;

        for (Path file : sourceFiles) {
            try {
                String content = Files.readString(file);
                totalLoc += (int) content.lines().filter(l -> !l.isBlank()).count();

                CompilationUnit cu = StaticJavaParser.parse(file);
                totalClasses += cu.getTypes().size();

                List<MethodDeclaration> methods = cu.findAll(MethodDeclaration.class);
                totalMethods += methods.size();

                for (MethodDeclaration m : methods) {
                    int lines = m.getRange().map(r -> r.getLineCount()).orElse(0);
                    totalMethodLines += lines;
                    totalComplexity += cyclomaticComplexityOf(m);
                }
            } catch (Exception e) {
                // Unparseable file (syntax error, unsupported Java version feature, etc.)
                // Skip it rather than failing the whole review - it'll still surface
                // as a static-analysis/AI finding separately.
            }
        }

        double avgMethodLength = totalMethods == 0 ? 0 : (double) totalMethodLines / totalMethods;
        double avgComplexity = totalMethods == 0 ? 0 : totalComplexity / totalMethods;

        // Simplified maintainability index (0-100, higher is better).
        // Real MI formula: 171 - 5.2*ln(HalsteadVolume) - 0.23*CC - 16.2*ln(LOC), rescaled.
        // We approximate Halstead volume's effect using LOC as a stand-in, which is
        // good enough for a relative "quality score" - swap in a real Halstead
        // calculator later if you want the textbook metric.
        double rawMi = 171 - 0.23 * avgComplexity - 16.2 * Math.log(Math.max(totalLoc, 1));
        double maintainabilityIndex = Math.max(0, Math.min(100, rawMi * 100 / 171));

        return new ComplexityMetrics(
                totalClasses, totalMethods, totalLoc,
                round(avgMethodLength), round(avgComplexity), round(maintainabilityIndex)
        );
    }

    /** McCabe cyclomatic complexity: 1 + number of decision points. */
    private int cyclomaticComplexityOf(MethodDeclaration method) {
        int complexity = 1;
        complexity += method.findAll(IfStmt.class).size();
        complexity += method.findAll(ForStmt.class).size();
        complexity += method.findAll(ForEachStmt.class).size();
        complexity += method.findAll(WhileStmt.class).size();
        complexity += method.findAll(DoStmt.class).size();
        complexity += method.findAll(SwitchEntry.class).size();
        complexity += method.findAll(CatchClause.class).size();
        return complexity;
    }

    private double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
