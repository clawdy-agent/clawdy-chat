FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

COPY frontend ./frontend
COPY backend ./backend

EXPOSE 3002

CMD ["node", "backend/src/server.js"]
