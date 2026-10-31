package com.example.authservice.config;

import com.example.authservice.entity.Role;
import com.example.authservice.entity.User;
import com.example.authservice.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail("admin@dealsplatform.com")) {
            User admin = new User();
            admin.setEmail("admin@dealsplatform.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setName("System Administrator");
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
            System.out.println("Default Admin Account Initialized: admin@dealsplatform.com / admin123");
        }
    }
}
