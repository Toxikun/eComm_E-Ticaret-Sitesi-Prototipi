# E-Commerce Microservices Prototype (eComm_E-Ticaret-Sitesi-Prototipi)

A full-stack, event-driven E-Commerce application built with a **Microservices Architecture**. This project serves as a comprehensive prototype demonstrating modern backend practices, inter-service communication, and a sleek frontend interface.

> **⚠️ Note on Payments:** This is a **prototype** and a portfolio project. It does **not** process real payments. There is no area to enter real credit card information, and no payment service. 

---

## 🏗️ Architecture & Tech Stack

The application is broken down into independent microservices, coordinated via an API Gateway and communicating asynchronously through a message broker.

### **Backend:**
*   **Infrastructure:** Node.js, Express.js, TypeScript
*   **Databases:** 
    *   **PostgreSQL** (Each microservice has its own isolated database/schema)
    *   **Redis** (Used for fast, temporary storage like the Shopping Cart)
*   **Message Broker:** **RabbitMQ** (For asynchronous event-driven communication, e.g., low stock alerts, order placements, notifications)
*   **Containerization:** **Docker & Docker Compose**

### **Frontend:**
*   **Framework:** React 18 with Vite
*   **Language:** TypeScript
*   **Styling:** Custom CSS with a modern, dark-mode-first aesthetic

---

## 🚀 Services Overview

The platform is divided into the following loosely-coupled microservices:

1.  **API Gateway:** Routes incoming frontend traffic to the appropriate backend microservice.
2.  **Auth Service:** Handles user registration, login, and JWT token generation.
3.  **User Service:** Manages user profiles, roles, and addresses.
4.  **Product Service:** Manages the product catalog, categories, and image uploads.
5.  **Cart Service:** Manages temporary user shopping carts (backed by Redis).
6.  **Order Service:** Handles the checkout process, order creation, and orchestrates actions across inventory and payments.
7.  **Payment Service:** Simulates payment processing (Mock Stripe flow).
8.  **Inventory Service:** Tracks product stock levels and reserves stock during checkout.
9.  **Notification Service:** Listens to RabbitMQ events (e.g., `order.placed`, `payment.failed`) and generates system notifications for users and sellers.

---

## 🛠️ How to Run Locally

To run the entire stack locally, you will need **Docker Desktop** installed and running on your machine.

### 1. Start the Backend Infrastructure
Open a terminal in the root folder of the project and run:
```bash
docker compose up --build
```
*This will spin up PostgreSQL, Redis, RabbitMQ, the API Gateway, and all 8 microservices.*

### 2. Start the Frontend Application
Open a **second** terminal, navigate to the frontend folder, and start the development server:
```bash
cd services/web-app
npm run dev
```

### 3. View the App
Open your browser and navigate to:
*   **Frontend UI:** `http://localhost:5173`
*   **API Gateway:** `http://localhost:3000`

---

## 📝 Features Demonstrated
*   **Microservices Pattern:** Independent deployment, separate databases per service.
*   **Event-Driven Architecture:** Services react to domain events via RabbitMQ (Publish/Subscribe).
*   **Authentication & Authorization:** JWT-based secure routes and role-based access control (Buyers vs. Sellers).
*   **State Management:** High-performance cart operations using Redis caching.
*   **Containerization:** Full unified local development environment using Docker Compose.

---

## 🌍 Going Live (Production Preparation)

This repository is configured purely for local development. If you wanted to take this project live, you would need to make the following architectural and code changes:

1.  **Remove Hardcoded Secrets:** The `docker-compose.yml` and various service environments currently contain hardcoded `JWT_SECRET`s, database passwords (`postgres`), and RabbitMQ credentials (`guest`). These must be moved to secure environment variables or a Secret Manager (like AWS Secrets Manager or HashiCorp Vault).
2.  **Implement a Real Payment Gateway:** The current `payment-service` uses a mock routing system. This would need to be replaced with the official Stripe, PayPal, or Braintree Node.js SDKs.
3.  **Production Infrastructure:** Move away from `docker compose up` to a managed orchestrator like **Kubernetes (K8s)** or Amazon ECS.
4.  **Managed Databases:** Replace the local Docker containers for PostgreSQL, Redis, and RabbitMQ with managed, highly available cloud equivalents (e.g., Amazon RDS, Amazon ElastiCache, Amazon MQ).
5.  **Reverse Proxy/Ingress Integration:** Put the API Gateway behind a production-grade Ingress controller (like NGINX or Traefik) equipped with SSL/TLS certificates for HTTPS.
6.  **External Image Hosting:** Currently, `product-service` saves image uploads to a local Docker volume. This logic must be rewritten to upload files to cloud object storage like AWS S3 or Cloudinary.

---

## ⚠️ Security Considerations & Risks

Because this is a developer prototype, it intentionally bypasses certain security measures to make local testing easier. **Do not deploy this code as-is**. Be aware of the following risks:

*   **No HTTPS/SSL:** Traffic between the frontend, API gateway, and microservices is unencrypted (HTTP). In production, all external traffic must be forced to HTTPS.
*   **Weak Passwords & Default Credentials:** The databases and message broker use default, easily guessable credentials (`postgres:postgres`, `guest:guest`).
*   **Permissive CORS:** The API gateway may be configured to accept cross-origin requests from any source (`*`) during development, which exposes the API to Cross-Site Request Forgery (CSRF) risks if deployed blindly.
*   **No Rate Limiting:** The API endpoints are currently unprotected against spam, brute-force attacks, or DDoS attempts. A rate limiter (like `express-rate-limit`) should be added to the API Gateway.
*   **Local File Uploads:** Allowing users to upload images directly to the server's filesystem (`product-service`) can lead to arbitrary file upload vulnerabilities or allow attackers to exhaust server disk space. Always validate file types strictly and stream them to external, sandboxed buckets (S3).
