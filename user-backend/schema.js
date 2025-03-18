const { buildSchema } = require('graphql');

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

module.exports = schema;