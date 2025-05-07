const express = require('express');
const { createHandler } = require('graphql-http/lib/use/express');
const { buildSchema } = require('graphql');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Идентификатор экземпляра для отслеживания в балансировке нагрузки
const INSTANCE_ID = process.env.INSTANCE_ID || `user-backend-${Math.random().toString(36).substring(2, 10)}`;
console.log(`Запуск экземпляра: ${INSTANCE_ID}`);

// 1. Загрузка данных из products.json (корень проекта)
let products;
try {
  const productsPath = path.join(__dirname, '../products.json');
  products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
  console.log('Товары загружены');
} catch (error) {
  console.error('Ошибка чтения products.json:', error);
  process.exit(1);
}

// 2. GraphQL схема
const schema = buildSchema(`
  type Product {
    id: ID!
    name: String!
    price: Float!
    description: String
    categories: [String!]!
  }

  type ServerInfo {
    instanceId: String!
    uptime: Float!
    timestamp: String!
  }

  type Query {
    products(fields: [String!]!): [Product!]!
    serverInfo: ServerInfo!
  }
`);

// Время запуска сервера для статистики
const startTime = Date.now();

// 3. Резолверы
const resolvers = {
  products: ({ fields }) => products.map(product => 
    Object.fromEntries(fields.map(field => [field, product[field]]))),
  serverInfo: () => ({
    instanceId: INSTANCE_ID,
    uptime: (Date.now() - startTime) / 1000,
    timestamp: new Date().toISOString()
  })
};

// 4. Настройка сервера
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  path: '/socket.io'
});

// 5. Middleware
app.use(express.static(path.join(__dirname, '../user-frontend')));
app.use(express.json());

// Добавляем информацию об экземпляре в заголовки для отладки
app.use((req, res, next) => {
  res.setHeader('X-Instance-ID', INSTANCE_ID);
  next();
});

// Добавляем маршрут для информации о сервере
app.get('/server-info', (req, res) => {
  res.json({
    instanceId: INSTANCE_ID,
    uptime: (Date.now() - startTime) / 1000,
    timestamp: new Date().toISOString()
  });
});

// 6. GraphQL endpoint
app.use('/graphql', createHandler({ schema, rootValue: resolvers }));

// 7. WebSocket 
let userCount = 0;
let messageHistory = [];

io.on('connection', (socket) => {
  userCount++;
  console.log(`Новое WebSocket соединение (экземпляр ${INSTANCE_ID}), всего пользователей: ${userCount}`);
  
  // Отправляем клиенту историю сообщений
  socket.emit('chatHistory', messageHistory);
  
  // Отправляем информацию об экземпляре сервера
  socket.emit('serverInfo', {
    instanceId: INSTANCE_ID,
    timestamp: new Date().toISOString(),
    connectedUsers: userCount
  });
  
  // Обновляем информацию для всех о количестве пользователей
  io.emit('userCount', { count: userCount });

  socket.on('chatMessage', (msg) => {
    const timestamp = new Date().toISOString();
    const messageWithMeta = {
      ...msg,
      timestamp,
      instanceId: INSTANCE_ID
    };
    
    // Сохраняем сообщение в истории
    messageHistory.push(messageWithMeta);
    if (messageHistory.length > 100) messageHistory.shift(); // Ограничиваем историю
    
    // Отправляем всем пользователям
    io.emit('chatMessage', messageWithMeta);
    console.log(`Сообщение от ${msg.user || 'анонима'}: ${msg.text} (обработано экземпляром ${INSTANCE_ID})`);
  });

  socket.on('disconnect', () => {
    userCount--;
    console.log(`Пользователь отключился (экземпляр ${INSTANCE_ID}), осталось пользователей: ${userCount}`);
    io.emit('userCount', { count: userCount });
  });
});

// 8. Запуск сервера
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Сервер пользователя запущен (${INSTANCE_ID}): http://localhost:${PORT}`);
});