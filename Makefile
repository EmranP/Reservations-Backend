ifneq ("$(wildcard .env)", "")
  include .env
  export
endif

export PROJECT_ROOT=${shell pwd}

# App
up:
	@docker compose -f docker-compose.yml up --build

up-d:
	@docker compose -f docker-compose.yml up -d --build

up-nc:
	@docker compose -f docker-compose.yml build --no-cache
	@docker compose -f docker-compose.yml up -d --force-recreate

recreate:
	docker compose -f docker-compose.yml up -d --no-deps --force-recreate $(service)

stop:
	@docker compose -f docker-compose.yml down

clear:
	@read -p "Clear all volume files of the environment? Data loss is dangerous. [y/N]: " ans; \
	if [ "$$ans" = "y" ] || [ "$$ans" = "yes" ]; then \
		docker compose -f docker-compose.yml down -v; \
		sudo rm -rf $(PROJECT_ROOT)/out; \
		echo "Files of the environment is clear"; \
	else \
		echo "Operation cancelled."; \
	fi;

port:
	@docker compose -f docker-compose.yml up -d port-forwarder

close-port:
	@docker compose -f docker-compose.yml down port-forwarder

.PHONY: up up-d up-nc up-d-nc stop port close-port clear