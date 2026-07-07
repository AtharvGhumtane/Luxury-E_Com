package com.lvmh.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import reactor.core.publisher.Mono;

@Configuration
public class RateLimiterConfig {

    /**
     * Resolves rate-limit bucket key by client IP address.
     */
    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            String ip = exchange.getRequest().getRemoteAddress() != null
                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                    : "unknown";
            return Mono.just(ip);
        };
    }

    /**
     * Default rate limiter: 100 requests/min, burst of 20.
     */
    @Primary
    @Bean
    public RedisRateLimiter defaultRateLimiter() {
        // replenishRate=100 (tokens/sec), burstCapacity=200, requestedTokens=1
        return new RedisRateLimiter(100, 200, 1);
    }

    /**
     * Strict rate limiter for auth endpoints: 10 requests/min (brute-force protection).
     */
    @Bean
    public RedisRateLimiter authRateLimiter() {
        return new RedisRateLimiter(10, 20, 1);
    }

    /**
     * Search rate limiter: 30 requests/min.
     */
    @Bean
    public RedisRateLimiter searchRateLimiter() {
        return new RedisRateLimiter(30, 60, 1);
    }
}
