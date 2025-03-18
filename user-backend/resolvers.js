const products = require('./products.json');

const resolvers = {
  products: ({ fields }) => {
    return products.map(product => {
      const filteredProduct = {};
      fields.forEach(field => {
        if (product[field] !== undefined) {
          filteredProduct[field] = product[field];
        }
      });
      return filteredProduct;
    });
  },
};

module.exports = resolvers;