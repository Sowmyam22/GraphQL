const { buildSchema } = require('graphql');

module.exports = buildSchema(`
  type TestData {
    text: String!
    views: Int!
  }

  type RootQuery {
    hello: TestData
  },

  schema {
    query: RootQuery
  }
`);


/** 
 * IT should be the POST request 
 * {
 * "query": "{ hello { text views } }"
 * } 
**/