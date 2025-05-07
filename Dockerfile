FROM node:22-slim

WORKDIR /app

# Копируем оба package.json
COPY admin-backend/package*.json ./admin-backend/
COPY user-backend/package*.json ./user-backend/
COPY package*.json ./

# Устанавливаем зависимости
RUN cd admin-backend && npm install
RUN cd user-backend && npm install
RUN npm install

# Копируем все файлы проекта
COPY . .

# Сервис определяется через переменные окружения в docker-compose
CMD ["sh", "-c", "if [ \"$SERVICE_TYPE\" = \"admin\" ]; then node admin-backend/server.js; else node user-backend/server.js; fi"]