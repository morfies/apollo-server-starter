# apollo-server-starter

I am researching on GraphQL for my FaaS platform actually.
This forked starter repo will help to understand how GraphQL server wire up the whole logic, including:

- How to define the gql schema
- How to write the resolvers
- How to use data sources such as db and restfull endpoints

## Schema

```gql
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
```

Here we defined 2 types and a Query entrypoint.
The `Author` and `Post` type has a relationship of One-to-Many, namely an Author can have multiple Posts, thus an array, and a Post is beloned to an Author.

This kind of nested structure can demo very well the power of GraphQL.

In the `Query` entrypoint, we have a few queries that can be done from GraphQL client.

- hello & test: these two are simpe examples of returning a string response
- author: this is an example of retrieving an Author info, accepting user input params [db datasource]
- allAuthors: this demos how to retrieving all Authors, the response is a list [db datasource]
- posts: get all the existing Posts, also returns a list [db datasource]
- getFortuneCookie: an example using REST api as a datasource [rest datasource]

## Resolver

The second required element for a GraphQL server is the resolvers, resolvers and schemas are mapped to each other.

For entrypoints in schema `Query`, there must be related resolvers in `Query`, shown as below.

For all non-scalar types in our schema, we also need to give out the resovers for these types, such as `Author` and `Post` here, and for the sub-fields that are non-scalar, we define the resolvers in a recursive way.

```js
const resolvers = {
  Query: {
    hello: (root, args, context) => 'Hello world!',
    test: () => 'test string',

    // we get all authors from db querying, no need parameters
    allAuthors: (root, args, context) => context.db.Author.findAll(),

    // here we depend on user provide `authorId` parameter to get all posts of a certain author
    posts: (root, args, context) => {
      console.log('args', args);
      return context.db.Post.findAll({
        where: {
          authorId: args.authorId,
        },
      });
    },

    // this resolver will get data from a restful api
    getFortuneCookie: async () => {
      const api = 'https://catfact.ninja/fact';
      const resp = await fetch(api);
      const content = await resp.json();
      return content.fact;
    },
  },

  // type Author has a non-scalar posts field, so we need to provide a resolver for posts
  Author: {
    posts: (root, args, context) => {
      console.log('Author.posts', root);
      // return context.db.Post.findAll({
      //   where: {
      //     authorId: root.id
      //   }
      // })
      return root.getPosts();
    },
  },
  // Same here, in type Post there is a non-scalar field author, we need to resolve it
  Post: {
    author: (root, args, context) => {
      console.log('Post.author', root);
      // return context.db.Author.findOne({
      //   where: {
      //     id: root.authorId
      //   }
      // })
      return root.getAuthor();
    },
  },
};
```

The `context` is what we provided while creating the ApolloServer:

```js
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: {
    // here we inject our squelize models into context for easy access
    db: {
      Author,
      Post,
    },
  },
});
```

I would like to talk more about the `Author` resolver here, the comented out lines can also work, but Squelize provides us with helper functions to build relations between models, in `connector.js` we have this:

```js
const AuthorModel = db.define('author', {
  firstName: { type: Sequelize.STRING },
  lastName: { type: Sequelize.STRING },
});

const PostModel = db.define('post', {
  title: { type: Sequelize.STRING },
  text: { type: Sequelize.STRING },
});
// https://sequelize.org/master/class/lib/associations/has-many.js~HasMany.html
AuthorModel.hasMany(PostModel);
// https://sequelize.org/master/class/lib/associations/belongs-to.js~BelongsTo.html
PostModel.belongsTo(AuthorModel);
```

The `hasMany` and `belongsTo` will generate a few useful getters and setters for modals, for example,
`AuthorModel.hasMany(PostModel)` will auto generate a getter like `authorModel.getPosts()` which will get all the posts of this author, quite convinent.

For more details, can check out squelize official doc link in the comment.
