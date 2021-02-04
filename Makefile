run:
	deno run --allow-net --allow-env app.ts

docker-build:
	docker build -t lukaswire/jira-broadcast-bot .