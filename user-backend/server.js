const express = require('express');
const { createHandler } = require('graphql-http/lib/use/express');
const { buildSchema } = require('graphql');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

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

  type Query {
    products(fields: [String!]!): [Product!]!
  }
`);

// 3. Резолверы
const resolvers = {
  products: ({ fields }) => products.map(product => 
    Object.fromEntries(fields.map(field => [field, product[field]])))
};  














// 4. Настройка сервера
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 5. Middleware
app.use(express.static(path.join(__dirname, '../user-frontend')));

// 6. GraphQL endpoint
app.use('/graphql', createHandler({ schema, rootValue: resolvers }));

// 7. WebSocket
io.on('connection', (socket) => {
  socket.on('chatMessage', (msg) => {
    io.emit('chatMessage', msg);
  });
});

// 8. Запуск сервера
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Сервер пользователя запущен: http://localhost:${PORT}`);
});