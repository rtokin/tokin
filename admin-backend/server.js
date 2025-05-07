const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');

let chatMessages = [];
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

// 2. Настройка сервера
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 3. Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../admin-frontend')));

// 4. REST API для админки
// Получить все товары
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Добавить товар
app.post('/api/products', (req, res) => {
  const newProduct = { id: products.length + 1, ...req.body };
  products.push(newProduct);
  fs.writeFileSync(path.join(__dirname, '../products.json'), JSON.stringify(products, null, 2));
  res.json({ message: 'Товар добавлен', product: newProduct });
});

// Удалить товар по ID
app.delete('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  products = products.filter(product => product.id !== id);
  fs.writeFileSync(path.join(__dirname, '../products.json'), JSON.stringify(products, null, 2));
  res.json({ message: 'Товар удален', id });
});

// Обновить товар по ID
app.put('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const updatedProduct = req.body;
  products = products.map(product =>
    product.id === id ? { ...product, ...updatedProduct } : product
  );
  fs.writeFileSync(path.join(__dirname, '../products.json'), JSON.stringify(products, null, 2));
  res.json({ message: 'Товар обновлен', product: updatedProduct });
});

// 5. WebSocket (общий чат с пользователем)
io.on('connection', (socket) => {
  console.log('Новое подключение к чату');

  // Отправляем историю сообщений новому пользователю
  socket.emit('chatHistory', chatMessages);

  // Обработка новых сообщений
  socket.on('chatMessage', (msg) => {
    // Добавляем сообщение в массив
    chatMessages.push(msg);
    // Рассылаем сообщение всем подключенным клиентам
    io.emit('chatMessage', msg);
  });

  socket.on('disconnect', () => {
    console.log('Пользователь отключился');
  });
});

// 6. Запуск сервера
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Сервер администратора запущен: http://localhost:${PORT}`);
});