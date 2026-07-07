# LVMH E-Commerce — Microservices Backend

A production-grade e-commerce backend built with **Java 17 + Spring Boot 3.x** following a **Microservices Architecture**.

## 🏗️ Architecture

| Service | Port | Description |
|---|---|---|
| **API Gateway** | 8080 | JWT auth, rate limiting, routing |
| **Auth Service** | 8081 | Register, login, JWT, refresh tokens |
| **User Service** | 8082 | Profiles & addresses |
| **Product Service** | 8083 | Catalog, Elasticsearch search, Redis cache |
| **Inventory Service** | 8084 | Stock management (Saga participant) |
| **Order Service** | 8085 | Cart (Redis) + Orders (Saga orchestrator) |
| **Payment Service** | 8086 | Stripe Test Mode + webhooks |
| **Notification Service** | 8087 | Event-driven email (Kafka) |
| **Config Server** | 8888 | Centralized config |
| **Discovery Server** | 8761 | Eureka |

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Maven 3.9+
- Docker + Docker Compose

### Step 1 — Set environment variables
```bash
# Create .env in project root
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
```

### Step 2 — Build all services
```bash
mvn clean package -DskipTests
```

### Step 3 — Start everything with Docker Compose
```bash
docker-compose up -d
```

### Step 4 — Verify all services are up
- Eureka Dashboard: http://localhost:8761
- API Gateway: http://localhost:8080
- Mailhog (emails): http://localhost:8025
- Zipkin (traces): http://localhost:9411

## 📚 Swagger UI

Each service exposes Swagger UI at `/swagger-ui.html`:
- Auth: http://localhost:8081/swagger-ui.html
- User: http://localhost:8082/swagger-ui.html
- Product: http://localhost:8083/swagger-ui.html
- Inventory: http://localhost:8084/swagger-ui.html
- Order: http://localhost:8085/swagger-ui.html
- Payment: http://localhost:8086/swagger-ui.html

## 🔄 Typical User Flow

```
1. POST /api/auth/register     → Get JWT tokens
2. POST /api/auth/login        → Get JWT (if existing user)
3. GET  /api/products          → Browse products
4. GET  /api/products/search?q= → Full-text search (Elasticsearch)
5. POST /api/cart/items        → Add to cart (Redis)
6. POST /api/orders            → Place order (Saga starts)
   → OpenFeign checks inventory
   → Order persisted (PENDING)
   → Kafka: order.created published
   → Inventory reserves stock
   → Payment initiates
7. POST /api/payments/initiate → Create Stripe PaymentIntent
8. [Stripe.js frontend confirms payment]
9. POST /api/payments/webhook  → Stripe notifies backend
   → Kafka: payment.completed published
   → Order marked PAID
   → Email sent
```

## 🔐 Authentication

All endpoints except `/api/auth/**` and public product browsing require a valid JWT:
```
Authorization: Bearer <access_token>
```

## 🐳 Stripe Webhook (Local Dev)

Use Stripe CLI to forward webhooks to your local instance:
```bash
stripe listen --forward-to localhost:8086/api/payments/webhook
```

## 🛠️ Tech Stack

- **Java 17** + **Spring Boot 3.2**
- **Spring Cloud 2023.0.1** (Eureka, Gateway, OpenFeign, Config)
- **Apache Kafka** — Choreography-based Saga
- **PostgreSQL** — Separate instance per service
- **Redis** — Cart, caching, rate limiting
- **Elasticsearch 8.x** — Product search
- **Stripe SDK** — Payment processing
- **Zipkin** — Distributed tracing
- **Mailhog** — Local email testing
- **Docker Compose** — Full local environment
