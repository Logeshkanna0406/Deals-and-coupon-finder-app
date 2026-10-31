package com.example.apigateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.Key;

/**
 * Global Gateway filter to validate JWT Bearer token on secured endpoints,
 * enforce role-based access for Admin routes, and forward user headers.
 */
@Component
public class AuthenticationFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationFilter.class);

    @Value("${jwt.secret:9a618c6d48fed2c7482a13876e5ff909192484ab9f4a7c29e248ab4c19a28b12}")
    private String jwtSecret;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        HttpMethod method = request.getMethod();

        // Check if endpoint is public
        if (isPublicEndpoint(path, method)) {
            if (request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    try {
                        String token = authHeader.substring(7);
                        Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                        Claims claims = Jwts.parserBuilder()
                                .setSigningKey(key)
                                .build()
                                .parseClaimsJws(token)
                                .getBody();
                        String email = claims.getSubject();
                        String role = (String) claims.get("role");
                        Object userId = claims.get("userId");
                        ServerHttpRequest mutatedRequest = request.mutate()
                                .header("X-User-Id", userId != null ? String.valueOf(userId) : "")
                                .header("X-User-Email", email != null ? email : "")
                                .header("X-User-Role", role != null ? role : "")
                                .build();
                        return chain.filter(exchange.mutate().request(mutatedRequest).build());
                    } catch (Exception e) {
                        log.debug("Ignoring invalid/expired token on public endpoint {}: {}", path, e.getMessage());
                        return chain.filter(exchange);
                    }
                }
            }
            return chain.filter(exchange);
        }

        // Validate Authorization header
        if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
            log.warn("Missing Authorization header for request to: {}", path);
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Invalid Authorization header format for request to: {}", path);
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);
        try {
            Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String email = claims.getSubject();
            String role = (String) claims.get("role");
            Object userId = claims.get("userId");

            // Role-based authorization for /api/admin/**
            if (path.startsWith("/api/admin") && !"ADMIN".equalsIgnoreCase(role)) {
                log.warn("Access denied: User with role [{}] attempted to access admin endpoint: {}", role, path);
                exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                return exchange.getResponse().setComplete();
            }

            // Mutate request headers to forward user info to downstream services
            ServerHttpRequest mutatedRequest = request.mutate()
                    .header("X-User-Id", userId != null ? String.valueOf(userId) : "")
                    .header("X-User-Email", email != null ? email : "")
                    .header("X-User-Role", role != null ? role : "")
                    .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());

        } catch (Exception e) {
            log.error("JWT token validation failed for path {}: {}", path, e.getMessage());
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }

    private boolean isPublicEndpoint(String path, HttpMethod method) {
        // All auth endpoints (register, login, forgot-password, reset-password, refresh-token)
        if (path.startsWith("/api/auth/")) {
            return true;
        }

        // Public browsing of subscription plans
        if (HttpMethod.GET.equals(method) && (path.equals("/api/subscriptions/plans") || path.startsWith("/api/subscriptions/plans/"))) {
            return true;
        }

        // Public discovery of active coupons and single deal details
        if (HttpMethod.GET.equals(method) && (path.equals("/api/coupons") || path.startsWith("/api/coupons/"))) {
            return true;
        }

        // Public directory of merchants
        if (HttpMethod.GET.equals(method) && (path.equals("/api/merchants") || path.startsWith("/api/merchants/"))) {
            return true;
        }

        // Swagger, OpenAPI, and Actuator endpoints
        if (path.startsWith("/v3/api-docs") || path.startsWith("/swagger-ui") || path.startsWith("/actuator")) {
            return true;
        }

        return false;
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
