// graphql.js

const { ApolloServer, gql } = require("apollo-server-lambda");
const { dateToDaynum, parser, todaysReminders } = require("@dayspringpartners/remind");
var AWS = require("aws-sdk");
const s3 = new AWS.S3();

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Query {
    hello: String
    reminders(today: String): [Reminder]
  }
  type Reminder {
    year: Int
    month: Int!
    day: Int!
    message: String!
  }
`;

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    hello: () => "Hello world!",
    reminders: (obj, args, context, info) => {
      return new Promise((resolver, reject) => {
        s3.getObject(
          {
            Bucket: "mdenson-general",
            Key: "reminders"
          },
          function(err, data) {
            if (err) {
              reject(err);
            } else {
              var reminders = [];
              if (args.today) {
                console.log('Argument ' + args.today + ' ' + new Date(args.today))
                reminders = todaysReminders(data.Body.toString("utf8"), dateToDaynum(new Date(args.today)));
              } else {
                reminders = parser(data.Body.toString("utf8"));
              }
              resolver(reminders);
            }
          }
        );
      });
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

exports.graphqlHandler = server.createHandler({
  cors: {
    origin: "*",
    credentials: true
  }
});
