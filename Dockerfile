FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --only=production

COPY backend ./backend
COPY frontend ./frontend

EXPOSE 3002

CMD ["node", "backend/src/server.js"]
