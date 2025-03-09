const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Отдача статики
app.use(express.static(path.join(__dirname, '../user-frontend')));

// API для получения товаров
app.get('/api/products', (req, res) => {
  try {
    const products = JSON.parse(fs.readFileSync(path.join(__dirname, '../products.json')));
    res.json(products);
  } catch (error) {
    console.error('Ошибка при чтении файла products.json:', error);
    res.status(500).send('Ошибка сервера');
  }
});

app.listen(port, () => {
  console.log(`User backend running on http://localhost:${port}`);
});