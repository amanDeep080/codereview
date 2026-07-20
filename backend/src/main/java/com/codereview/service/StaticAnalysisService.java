package com.codereview.service;

import com.codereview.entity.ReviewFinding;
import com.puppycrawl.tools.checkstyle.Checker;
import com.puppycrawl.tools.checkstyle.ConfigurationLoader;
import com.puppycrawl.tools.checkstyle.PropertiesExpander;
import com.puppycrawl.tools.checkstyle.api.AuditEvent;
import com.puppycrawl.tools.checkstyle.api.AuditListener;
import com.puppycrawl.tools.checkstyle.api.SeverityLevel;
import net.sourceforge.pmd.PMDConfiguration;
import net.sourceforge.pmd.PmdAnalysis;
import net.sourceforge.pmd.lang.rule.RulePriority;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

/**
 * Runs Checkstyle + PMD against the extracted project and normalizes
 * their output into the shared ReviewFinding model.
 *
 * SpotBugs requires compiled .class files (it does bytecode analysis, not
 * source analysis), so runSpotBugs() expects a compiledClassesDir - wire this
 * to a `mvn compile`/`javac` step in the pipeline before calling it. If the
 * uploaded project can't be compiled, skip this stage gracefully (see
 * ReviewOrchestrationService for the try/catch pattern).
 */
@Service
public class StaticAnalysisService {

    public List<ReviewFinding> runCheckstyle(Path projectRoot, List<Path> sourceFiles) {
        List<ReviewFinding> findings = new ArrayList<>();
        try {
            Checker checker = new Checker();
            checker.setModuleClassLoader(Thread.currentThread().getContextClassLoader());
            // Loads Sun-style checks bundled with checkstyle-core; swap for a custom
            // checkstyle.xml on the classpath to match your institute's coding standard.
            var config = ConfigurationLoader.loadConfiguration(
                    StaticAnalysisService.class.getClassLoader().getResource("checkstyle.xml").toString(),
                    new PropertiesExpander(new Properties())
            );
            checker.setModuleClassLoader(Thread.currentThread().getContextClassLoader());
            checker.configure(config);

            checker.addListener(new AuditListener() {
                @Override public void auditStarted(AuditEvent event) {}
                @Override public void auditFinished(AuditEvent event) {}
                @Override public void fileStarted(AuditEvent event) {}
                @Override public void fileFinished(AuditEvent event) {}

                @Override
                public void addError(AuditEvent event) {
                    findings.add(ReviewFinding.builder()
                            .severity(mapSeverity(event.getSeverityLevel()))
                            .source(ReviewFinding.Source.CHECKSTYLE)
                            .issue(event.getViolation() != null ? event.getViolation().getKey() : "Style violation")
                            .explanation(event.getMessage())
                            .suggestion("Follow the project's coding standard for this construct.")
                            .fileName(event.getFileName())
                            .lineNumber(event.getLine())
                            .build());
                }

                @Override
                public void addException(AuditEvent event, Throwable throwable) {}
            });

            checker.process(sourceFiles.stream().map(Path::toFile).toList());
            checker.destroy();
        } catch (Exception e) {
            // A checkstyle config/parse failure shouldn't kill the whole review -
            // surface it as a single INFO finding instead.
            findings.add(infoFailure("Checkstyle", e));
        }
        return findings;
    }

    public List<ReviewFinding> runPmd(Path projectRoot) {
        List<ReviewFinding> findings = new ArrayList<>();
        try {
            PMDConfiguration config = new PMDConfiguration();
            config.addInputPath(projectRoot);
            // "quickstart.xml" ruleset covers best-practice/design/error-prone rules;
            // combine with "category/java/security.xml" etc. as needed.
            config.addRuleSet("rulesets/java/quickstart.xml");
            config.setMinimumPriority(RulePriority.LOW);

            try (PmdAnalysis pmd = PmdAnalysis.create(config)) {
                var report = pmd.performAnalysisAndCollectReport();
                report.getViolations().forEach(v -> findings.add(ReviewFinding.builder()
                        .severity(mapPmdPriority(v.getRule().getPriority()))
                        .source(ReviewFinding.Source.PMD)
                        .issue(v.getRule().getName())
                        .explanation(v.getDescription())
                        .suggestion("See PMD rule '" + v.getRule().getName() + "' documentation for the recommended fix.")
                        .fileName(v.getFileId().getFileName())
                        .lineNumber(v.getBeginLine())
                        .build()));
            }
        } catch (Exception e) {
            findings.add(infoFailure("PMD", e));
        }
        return findings;
    }

    /** compiledClassesDir must contain .class files (see class javadoc). */
    public List<ReviewFinding> runSpotBugs(File compiledClassesDir) {
        List<ReviewFinding> findings = new ArrayList<>();
        try {
            // SpotBugs' programmatic API is heavier to wire (needs a Project +
            // BugReporter + FindBugs2 engine). Stub left intentionally explicit:
            // TODO: build edu.umd.cs.findbugs.FindBugs2 with a BugReporter that
            // maps each reported BugInstance -> ReviewFinding, same shape as above.
            findings.add(ReviewFinding.builder()
                    .severity(ReviewFinding.Severity.INFO)
                    .source(ReviewFinding.Source.SPOTBUGS)
                    .issue("SpotBugs not yet wired")
                    .explanation("SpotBugs requires compiled bytecode. Add a compile step " +
                            "(e.g. invoke javac/maven on the extracted project) before enabling this stage.")
                    .build());
        } catch (Exception e) {
            findings.add(infoFailure("SpotBugs", e));
        }
        return findings;
    }

    private ReviewFinding infoFailure(String tool, Exception e) {
        return ReviewFinding.builder()
                .severity(ReviewFinding.Severity.INFO)
                .source(ReviewFinding.Source.CHECKSTYLE)
                .issue(tool + " could not complete")
                .explanation(e.getMessage())
                .build();
    }

    private ReviewFinding.Severity mapSeverity(SeverityLevel level) {
        return switch (level) {
            case ERROR -> ReviewFinding.Severity.HIGH;
            case WARNING -> ReviewFinding.Severity.MEDIUM;
            case INFO -> ReviewFinding.Severity.LOW;
            default -> ReviewFinding.Severity.INFO;
        };
    }

    private ReviewFinding.Severity mapPmdPriority(RulePriority priority) {
        return switch (priority) {
            case HIGH -> ReviewFinding.Severity.CRITICAL;
            case MEDIUM_HIGH -> ReviewFinding.Severity.HIGH;
            case MEDIUM -> ReviewFinding.Severity.MEDIUM;
            case MEDIUM_LOW -> ReviewFinding.Severity.LOW;
            default -> ReviewFinding.Severity.INFO;
        };
    }
}
