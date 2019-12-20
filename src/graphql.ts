import { dateToDaynum, parser, todaysReminders } from '@dayspringpartners/remind';
import { ApolloServer } from 'apollo-server-lambda';
import * as S3 from 'aws-sdk/clients/s3';
import gql from 'graphql-tag';

const s3 = new S3();

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
    hello: () => 'Hello world!',
    reminders: (obj: any, args: any, context: any, info: any) => {
      return new Promise((resolver, reject) => {
        s3.getObject(
          {
            Bucket: 'mdenson-general',
            Key: 'reminders'
          },
          (err: any, data: any) => {
            if (err) {
              reject(err);
            } else {
              let reminders = [];
              if (args.today) {
                // console.log('Argument ' + args.today + ' ' + new Date(args.today))
                reminders = todaysReminders(data.Body.toString('utf8'), dateToDaynum(new Date(args.today)));
              } else {
                reminders = parser(data.Body.toString('utf8'));
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
    credentials: true,
    origin: '*'
  }
});
