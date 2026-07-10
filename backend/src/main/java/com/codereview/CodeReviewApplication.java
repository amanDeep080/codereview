package com.codereview;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync // review pipeline (static analysis + AI call) runs off the request thread
public class CodeReviewApplication {
    public static void main(String[] args) {
        // Load .env file and set as system properties
        Dotenv dotenv = Dotenv.configure()
                .directory("./backend") // Look inside the backend folder
                .ignoreIfMissing()
                .load();
        dotenv.entries().forEach(entry -> System.setProperty(entry.getKey(), entry.getValue()));

        SpringApplication.run(CodeReviewApplication.class, args);
    }
}
