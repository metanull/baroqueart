FROM node:lts-alpine
WORKDIR /app
EXPOSE 5173
# The repo is bind-mounted at /app and your own ~/.npmrc read-only at
# /root/.npmrc (see compose.yml). Installing at start-up keeps the container in
# sync with the mounted lockfile; the @metanull packages resolve through your
# personal GitHub Packages login. Nothing in this repository holds a token.
CMD ["sh", "-c", "npm ci && npm run dev -- --host --port 5173 --strictPort"]
