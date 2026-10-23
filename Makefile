.PHONY: test build

test:
	npm test

build:
	docker build -t tendril-backend .
