PROJECT_NAME=finalproject

.PHONY: makebuild build run stop shell logs clean

makebuild: build

build:
	docker compose build

run:
	docker compose up -d

stop:
	docker compose down

shell:
	@echo "Select service to shell into: backend | frontend | mongo"
	@read -p "Service: " svc; \
	if [ "$$svc" = "backend" ]; then docker exec -it $(PROJECT_NAME)-backend /bin/bash || docker exec -it $(PROJECT_NAME)-backend /bin/sh; \
	elif [ "$$svc" = "frontend" ]; then docker exec -it $(PROJECT_NAME)-frontend /bin/sh; \
	elif [ "$$svc" = "mongo" ]; then docker exec -it $(PROJECT_NAME)-mongo /bin/bash || docker exec -it $(PROJECT_NAME)-mongo /bin/sh; \
	else echo "Unknown service: $$svc"; fi

logs:
	docker compose logs -f

clean:
	docker compose down -v --rmi local


