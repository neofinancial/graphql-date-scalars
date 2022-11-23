# graphql-date-scalars

[![Build status](https://github.com/neofinancial/graphql-date-scalars/workflows/CI/badge.svg)](https://github.com/neofinancial/graphql-date-scalars/actions)
![TypeScript 4.4.4](https://img.shields.io/badge/TypeScript-4.4.4-brightgreen.svg)

GraphQL Scalars for Date (YYYY-MM-DD), DateTime (YYYY-MM-DDTHH:MM:SSZ), and Time (HH:MM:SSZ)

## Schema Usage

```ts
import { gql, ApolloServer } from 'apollo-server';
import { DateScalar, TimeScalar, DateTimeScalar } from 'graphql-date-scalars';

const resolvers = {
  // Must define resolvers for these scalars
  Date: DateScalar,
  Time: TimeScalar,
  DateTime: DateTimeScalar,

  // along with all your other resolvers
  Query: {
    exampleDateQuery: () => {
      // Will serialize to a date string, such as 2007-12-03
      return new Date();
    },
    exampleTimeQuery: () => {
      // Will serialize to a time string at UTC, such as 10:15:30Z
      return new Date();
    },
  },
  Mutation: {
    exampleDateTimeMutation: () => {
      // Will serialize to a date-time string at UTC, such as 2007-12-03T10:15:30Z
      return new Date();
    },
  },
};

const typeDefs = gql`
  scalar Date
  scalar DateTime

  extend type Query {
    exampleDateQuery: Date!
    exampleTimeQuery: Time!
  }

  extend type Mutation {
    exampleDateTimeMutation: DateTime!
  }
`;

const server = new ApolloServer({
  typeDefs,
  resolvers,
});
```

If you are using `@graphql-codegen` then you must include these scalars in your codegen yml file under `config`

```yml
schema: './example-schema.graphql'
config:
  scalars:
    Date: Date
    Time: Date
    DateTime: Date
generates:
  src/types/example-schema.d.ts:
    plugins:
      - 'typescript'
```

## Direct Usage

You can also use the parse and serialize methods directly, which is useful if you are
making a rest call to a 3rd party vendor.

```ts
import { DateTimeScalar } from 'graphql-date-scalars';

const vendorResponse = await restClient.get();

const response = {
  ...vendorResponse,
  createdAt: DateTimeScalar.parseValue(vendorResponse.createdAt),
};
```

```ts
import { DateScalar } from 'graphql-date-scalars';

const args = {
  ...input,
  dateOfBirth: DateScalar.serialize(input.dateOfBirth),
};

const response = await restClient.post(args);
```

## Contributing

1. Fork this repo
1. Clone the forked repo
1. Install dependencies: `npm i`

### Building

#### `npm run build`

To clean the build directory run `npm run clean`

### Running Tests

#### `npm run test`

## Publishing

1. Update the version in `package.json`
1. Add a `CHANGELOG.md` entry
1. Commit your changes
1. Run `npm pack` to see what will be published then delete the `.tgz` file that was created
1. Run `npm publish`
1. Create a release on GitHub. Use the version as the tag and release name. For example for version `1.0.0` the tag and release name would be `v1.0.0`.

## Contributors

This project started as a fork of https://github.com/excitement-engineer/graphql-iso-date
