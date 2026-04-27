.PHONY: help install build up down logs dev test clean

help:
	@echo "HRMS Modern - Development Commands"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make install        - Install all dependencies"
	@echo "  make build          - Build Docker images"
	@echo ""
	@echo "Running:"
	@echo "  make up             - Start all services"
	@echo "  make down           - Stop all services"
	@echo "  make logs           - View Docker logs (all services)"
	@echo "  make dev            - Start in development mode"
	@echo ""
	@echo "Database:"
	@echo "  make migrate        - Run database migrations"
	@echo "  make seed           - Seed initial data"
	@echo ""
	@echo "Testing:"
	@echo "  make test           - Run tests"
	@echo "  make test-backend   - Run backend tests"
	@echo "  make test-frontend  - Run frontend tests"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean          - Stop services and remove volumes"
	@echo "  make reset-db       - Reset database"

install:
	cd backend && python -m pip install -r requirements.txt
	cd frontend && npm install
	@echo "✓ Dependencies installed"

build:
	docker-compose build
	@echo "✓ Docker images built"

up:
	docker-compose up -d
	@echo "✓ Services started"
	@echo "Frontend:  http://localhost:3000"
	@echo "Backend:   http://localhost:8000"
	@echo "Nginx:     http://localhost"

down:
	docker-compose down
	@echo "✓ Services stopped"

logs:
	docker-compose logs -f

logs-frontend:
	docker-compose logs -f frontend

logs-backend:
	docker-compose logs -f backend

logs-postgres:
	docker-compose logs -f postgres

dev:
	@echo "Starting development services..."
	docker-compose up -d postgres nginx
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
	cd frontend && npm run dev &
	@echo "✓ Development environment started"

migrate:
	docker-compose exec backend python -m app.db.init
	@echo "✓ Migrations completed"

seed:
	docker-compose exec backend python -m app.scripts.seed
	@echo "✓ Database seeded"

test:
	@make test-backend
	@make test-frontend

test-backend:
	cd backend && pytest tests/ -v

test-frontend:
	cd frontend && npm run test

clean:
	docker-compose down -v
	@echo "✓ All services and volumes removed"

reset-db:
	docker-compose down postgres
	docker volume rm hrms-modern_postgres_data || true
	docker-compose up -d postgres
	@echo "✓ Database reset"

ps:
	docker-compose ps

shell-backend:
	docker-compose exec backend bash

shell-frontend:
	docker-compose exec frontend sh

shell-postgres:
	docker-compose exec postgres psql -U ${DB_USER:-hrms_user} -d ${DB_NAME:-hrms_db}

restart:
	docker-compose restart
	@echo "✓ Services restarted"

status:
	@echo "=== Service Status ==="
	docker-compose ps
	@echo ""
	@echo "=== Container Health ==="
	docker-compose ps | grep -E "backend|postgres"
