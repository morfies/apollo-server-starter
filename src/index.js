const { ApolloServer, gql } = require("apollo-server");
const { Author, Post } = require('./data/connectors');
const fetch = require('node-fetch');

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Author {
    id: Int
    firstName: String
    lastName: String
    posts: [Post]
  }
  type Post {
    id: Int
    title: String
    text: String
    views: Int
    author: Author
  }
  type Query {
    hello: String
    test: String
    author(firstName: String, lastName: String): Author
    allAuthors: [Author]
    posts(authorId: Int): [Post]
    getFortuneCookie: String # we'll use this later
  }
`;

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    hello: (root, args, context) => "Hello world!",
    test: () => "test string",
    allAuthors: (root, args, context) => context.db.Author.findAll(),
    posts: (root, args, context) => {
      console.log('args', args);
      return context.db.Post.findAll({
        where: {
          authorId: args.authorId
        }
      })
    },
    getFortuneCookie: async () => {
      const api = 'https://catfact.ninja/fact'
      const resp = await fetch(api);
        const content = await resp.json();
        return content.fact;
    }
  },
  Author: {
    posts: (root, args, context) => {
      console.log('Author.posts', root);
      // return context.db.Post.findAll({
      //   where: {
      //     authorId: root.id
      //   }
      // })
      return root.getPosts()
    }
  },
  Post: {
    author: (root, args, context) => {
      console.log('Post.author', root);
      // return context.db.Author.findOne({
      //   where: {
      //     id: root.authorId
      //   }
      // })
      return root.getAuthor();
    }
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: {
    db: {
      Author, Post
    }
  }
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});