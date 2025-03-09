const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const port = 8080;

// Загрузка товаров
let products;
try {
  products = JSON.parse(fs.readFileSync(path.join(__dirname, '../products.json')));
  console.log('Товары успешно загружены:', products);
} catch (error) {
  console.error('Ошибка при чтении файла products.json:', error);
  process.exit(1); // Завершить процесс, если файл не удалось прочитать
}

// Отдача статики
app.use(express.static(path.join(__dirname, '../admin-frontend')));

// Отдача статики для админки
app.use(express.static(path.join(__dirname, '../admin-frontend')));

// Маршрут для /main
app.get('/main', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-frontend/index.html'));
});

app.get('/api/products', (req, res) => res.json(products));

app.post('/api/products', (req, res) => {
  const newProducts = req.body;
  newProducts.forEach(product => {
    product.id = products.length + 1; // Генерация ID
    products.push(product);
  });
  fs.writeFileSync(path.join(__dirname, '../products.json'), JSON.stringify(products, null, 2));
  res.send('Товары добавлены');
});

app.listen(port, () => {
  console.log(`Admin backend running on http://localhost:${port}`);
});