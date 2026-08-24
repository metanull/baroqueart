FROM node:lts-alpine
WORKDIR /app
EXPOSE 5173
# The repo is bind-mounted at /app (see compose.yml). Installing at start-up
# keeps the container in sync with the mounted lockfile; NODE_AUTH_TOKEN comes
# from .env and lets npm read the @metanull packages on GitHub Packages.
CMD ["sh", "-c", "npm ci && npm run dev -- --host --port 5173 --strictPort"]
