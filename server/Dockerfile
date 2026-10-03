FROM node:20-alpine

WORKDIR /app

# copy package files first so Docker can cache the npm install step
COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src

EXPOSE 5000

CMD ["node", "src/index.js"]
