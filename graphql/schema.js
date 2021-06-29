const { buildSchema } = require('graphql');

// module.exports = buildSchema(`
//   type TestData {
//     text: String!
//     views: Int!
//   }

//   type RootQuery {
//     hello: TestData
//   }

//   schema {
//     query: RootQuery
//   }
// `);


/** 
 * Query
 * IT should be the POST request 
 * {
 * "query": "{ hello { text views } }"
 * } 
**/

// posts: [Post!]! => for adding array pf posts data in the user

// to check in the GraphiQL

/** 
 * http://localhost:8080/graphql
 * 
 * mutation {
 * createUser(userInput: {email: "test8@gmail.com", name: "test8", password: "test"}) {
 * _id
 * email
 * }
 * }
 **/ 

module.exports = buildSchema(`
  type Post {
    _id: ID!
    title: String!
    content: String!
    imageUrl: String!
    creator: User!
    createdAt: String!
    updatedAt: String!
  }

  type User {
    _id: ID!
    name: String!
    email: String!
    password: String
    status: String!
  }

  type AuthData {
    token: String!
    userId: String!
  }

  type PostData {
    posts: [Post!]!
    totalPosts: Int!
  }

  input UserInputData {
    email: String!
    name: String!
    password: String!
  }

  input PostInputData {
    title: String!
    content:String!
    imageUrl: String!
  }

  type RootQuery {
    login(email: String!, password:String!): AuthData!
    posts(page: Int): PostData!
    post(id: ID!): Post!
  }

  type RootMutation {
    createUser(userInput: UserInputData): User!
    createPost(postInput: PostInputData): Post!
    updatePost(id: ID!, postInput: PostInputData): Post!
  } 

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`)