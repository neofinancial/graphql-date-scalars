/* eslint-disable @typescript-eslint/no-explicit-any */

import { graphql, GraphQLObjectType, GraphQLSchema, GraphQLError, Kind } from 'graphql';
import { stringify } from 'jest-matcher-utils';

import { DateScalar } from '../../src/scalars/date';

describe('Date scalar', () => {
  const invalidDates = ['invalid date', '2015-02-29'];

  const validDates: [string, Date][] = [
    ['2016-12-17', new Date(Date.UTC(2016, 11, 17))],
    ['2016-02-01', new Date(Date.UTC(2016, 1, 1))],
  ];

  test('has a description', () => {
    expect(DateScalar.description).toMatchSnapshot();
  });

  describe('serialization', () => {
    [{}, [], null, undefined, true].forEach((invalidInput) => {
      test(`throws error when serializing ${stringify(invalidInput)}`, () => {
        expect(() => DateScalar.serialize(invalidInput)).toThrowErrorMatchingSnapshot();
      });
    });

    [
      [new Date(Date.UTC(2016, 11, 17, 14)), '2016-12-17'],
      [new Date(Date.UTC(2016, 0, 1, 14, 48, 10, 3)), '2016-01-01'],
      [new Date(Date.UTC(2016, 0, 1)), '2016-01-01'],
    ].forEach(([value, expected]) => {
      test(`serializes javascript Date ${stringify(value)} into ${stringify(expected)}`, () => {
        expect(DateScalar.serialize(value)).toEqual(expected);
      });
    });

    test(`throws error when serializing invalid javascript Date`, () => {
      expect(() => DateScalar.serialize(new Date('invalid date'))).toThrowErrorMatchingSnapshot();
    });

    invalidDates.forEach((dateString) => {
      test(`throws an error when serializing an invalid date-string ${stringify(dateString)}`, () => {
        expect(() => DateScalar.serialize(dateString)).toThrowErrorMatchingSnapshot();
      });
    });
  });

  describe('value parsing', () => {
    validDates.forEach(([value, expected]) => {
      test(`parses date-string ${stringify(value)} into javascript Date ${stringify(expected)}`, () => {
        expect(DateScalar.parseValue(value)).toEqual(expected);
      });
    });

    [4566, {}, [], true, null].forEach((invalidInput) => {
      test(`throws an error when parsing ${stringify(invalidInput)}`, () => {
        expect(() => DateScalar.parseValue(invalidInput)).toThrowErrorMatchingSnapshot();
      });
    });

    invalidDates.forEach((dateString) => {
      test(`throws an error parsing an invalid datetime-string ${stringify(dateString)}`, () => {
        expect(() => DateScalar.parseValue(dateString)).toThrowErrorMatchingSnapshot();
      });
    });
  });

  describe('literal parsing', () => {
    validDates.forEach(([value, expected]) => {
      const literal = {
        kind: Kind.STRING,
        value,
      };

      test(`parses literal ${stringify(literal)} into javascript Date ${stringify(expected)}`, () => {
        expect(DateScalar.parseLiteral(literal, {})).toEqual(expected);
      });
    });

    invalidDates.forEach((value) => {
      const invalidLiteral = {
        kind: Kind.STRING,
        value,
      };

      test(`errors when parsing invalid literal ${stringify(invalidLiteral)}`, () => {
        expect(() => DateScalar.parseLiteral(invalidLiteral, {})).toThrowErrorMatchingSnapshot();
      });
    });

    [
      {
        kind: Kind.FLOAT,
        value: '5',
      },
      {
        kind: Kind.BOOLEAN,
        value: false,
      },
    ].forEach((literal) => {
      test(`errors when parsing invalid literal ${stringify(literal)}`, () => {
        expect(() => DateScalar.parseLiteral(literal, {})).toThrowErrorMatchingSnapshot();
      });
    });
  });
});

describe('Date integration', () => {
  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        validDate: {
          type: DateScalar,
          resolve: () => new Date('2016-05-02'),
        },
        invalidDate: {
          type: DateScalar,
          resolve: () => new Date('wrong'),
        },
        invalidType: {
          type: DateScalar,
          resolve: () => 5,
        },
        input: {
          type: DateScalar,
          args: {
            date: {
              type: DateScalar,
            },
          },
          resolve: (_, input) => input.date,
        },
      },
    }),
  });

  it('executes a query that includes a date', async () => {
    const query = `
     query DateTest($date: Date!) {
       validDate
       input(date: $date)
       inputNull: input
     }
   `;

    const variables = { date: '2017-10-01' };

    const response = await graphql(schema, query, null, null, variables);

    expect(response).toEqual({
      data: {
        validDate: '2016-05-02',
        input: '2017-10-01',
        inputNull: null,
      },
    });
  });

  it('parses input to a JS Date', () => {
    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          input: {
            type: DateScalar,
            args: {
              date: {
                type: DateScalar,
              },
            },
            resolve: (_, input) => {
              expect(input.date).toEqual(new Date(Date.UTC(2016, 11, 17)));
            },
          },
        },
      }),
    });

    const query = `
     query DateTest($date: Date!) {
       input(date: $date)
     }
   `;
    const variables = { date: '2016-12-17' };

    graphql(schema, query, null, null, variables);
  });

  it('errors if there is an invalid date returned from the resolver', async () => {
    const query = `
     {
       invalidDate
       invalidType
     }
   `;

    const response = await graphql(schema, query);

    expect(response).toEqual({
      data: {
        invalidDate: null,
        invalidType: null,
      },
      errors: [
        new GraphQLError('Date cannot represent an invalid Date instance'),
        new GraphQLError('Date cannot represent non-date type'),
      ],
    });
  });

  it('errors if the variable value is not a valid date', async () => {
    const query = `
     query DateTest($date: Date!) {
       input(date: $date)
     }
   `;

    const variables = { date: '2017-10-001' };

    const response = await graphql(schema, query, null, null, variables);

    expect(response).toEqual({
      errors: [
        new GraphQLError(
          'Variable "$date" got invalid value "2017-10-001"; Expected type "Date". Date cannot represent an invalid date-string 2017-10-001.'
        ),
      ],
    });
  });

  it('errors if the variable value is not of type string', async () => {
    const query = `
     query DateTest($date: Date!) {
       input(date: $date)
     }
   `;

    const variables = { date: 4 };

    const response = await graphql(schema, query, null, null, variables);

    expect(response).toEqual({
      errors: [
        new GraphQLError(
          'Variable "$date" got invalid value 4; Expected type "Date". Date cannot represent non string type 4'
        ),
      ],
    });
  });

  it('errors if the literal input value is not a valid date', async () => {
    const query = `
     {
       input(date: "2017-10-001")
     }
   `;

    const response = await graphql(schema, query);

    expect(response).toEqual({
      errors: [
        new GraphQLError(
          'Expected value of type "Date", found "2017-10-001"; Date cannot represent an invalid date-string 2017-10-001.'
        ),
      ],
    });
  });

  it('errors if the literal input value in a query is not a string', async () => {
    const query = `
     {
       input(date: 4)
     }
   `;

    const response = await graphql(schema, query);

    expect(response).toEqual({
      errors: [
        new GraphQLError('Expected value of type "Date", found 4; Date cannot represent non string type IntValue'),
      ],
    });
  });
});
