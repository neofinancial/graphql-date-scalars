import { graphql, GraphQLObjectType, GraphQLSchema, GraphQLError, Kind } from 'graphql';
import { stringify } from 'jest-matcher-utils';

import DateTimeScalar from '../../src/scalars/date-time';

describe('DateTime scalar', () => {
  const invalidDates = [
    // General
    'Invalid date',
    // Datetime with hours
    '2016-02-01T00Z',
    // Datetime with hours and minutes
    '2016-02-01T00:00Z',
    // Datetime with hours, minutes and seconds
    '2016-02-01T000059Z',
    // Datetime with hours, minutes, seconds and fractional seconds
    '2016-02-01T00:00:00.Z',
    // Datetime with hours, minutes, seconds, fractional seconds and timezone.
    '2015-02-24T00:00:00.000+0100'
  ];

  const validDates: [string, Date][] = [
    // Datetime with hours, minutes and seconds
    ['2016-02-01T00:00:15Z', new Date(Date.UTC(2016, 1, 1, 0, 0, 15))],
    ['2016-02-01T00:00:00-11:00', new Date(Date.UTC(2016, 1, 1, 11))],
    ['2017-01-07T11:25:00+01:00', new Date(Date.UTC(2017, 0, 7, 10, 25))],
    ['2017-01-07T00:00:00+01:20', new Date(Date.UTC(2017, 0, 6, 22, 40))],
    // Datetime with hours, minutes, seconds and fractional seconds
    ['2016-02-01T00:00:00.1Z', new Date(Date.UTC(2016, 1, 1, 0, 0, 0, 100))],
    ['2016-02-01T00:00:00.000Z', new Date(Date.UTC(2016, 1, 1, 0, 0, 0, 0))],
    ['2016-02-01T00:00:00.990Z', new Date(Date.UTC(2016, 1, 1, 0, 0, 0, 990))],
    ['2016-02-01T00:00:00.23498Z', new Date(Date.UTC(2016, 1, 1, 0, 0, 0, 234))],
    ['2017-01-07T11:25:00.450+01:00', new Date(Date.UTC(2017, 0, 7, 10, 25, 0, 450))]
  ];

  test('has a description', () => {
    expect(DateTimeScalar.description).toMatchSnapshot();
  });

  describe('serialization', () => {
    [{}, [], null, undefined, true].forEach(invalidInput => {
      test(`throws error when serializing ${stringify(invalidInput)}`, () => {
        expect(() => DateTimeScalar.serialize(invalidInput)).toThrowErrorMatchingSnapshot();
      });
    });

    [
      [new Date(Date.UTC(2016, 0, 1)), '2016-01-01T00:00:00.000Z'],
      [new Date(Date.UTC(2016, 0, 1, 14, 48, 10, 30)), '2016-01-01T14:48:10.030Z']
    ].forEach(([value, expected]) => {
      test(`serializes javascript Date ${stringify(value)} into ${stringify(expected)}`, () => {
        expect(DateTimeScalar.serialize(value)).toEqual(expected);
      });
    });

    test(`throws error when serializing invalid date`, () => {
      expect(() => DateTimeScalar.serialize(new Date('invalid date'))).toThrowErrorMatchingSnapshot();
    });
  });

  describe('value parsing', () => {
    validDates.forEach(([value, expected]) => {
      test(`parses date-string ${stringify(value)} into javascript Date ${stringify(expected)}`, () => {
        expect(DateTimeScalar.parseValue(value)).toEqual(expected);
      });
    });

    [4566, {}, [], true, null].forEach(invalidInput => {
      test(`throws an error when parsing ${stringify(invalidInput)}`, () => {
        expect(() => DateTimeScalar.parseValue(invalidInput)).toThrowErrorMatchingSnapshot();
      });
    });

    invalidDates.forEach(dateString => {
      test(`throws an error parsing an invalid date-string ${stringify(dateString)}`, () => {
        expect(() => DateTimeScalar.parseValue(dateString)).toThrowErrorMatchingSnapshot();
      });
    });
  });

  describe('literal parsing', () => {
    validDates.forEach(([value, expected]) => {
      const literal = {
        kind: Kind.STRING,
        value
      };

      test(`parses literal ${stringify(literal)} into javascript Date ${stringify(expected)}`, () => {
        expect(DateTimeScalar.parseLiteral(literal, {})).toEqual(expected);
      });
    });

    invalidDates.forEach(value => {
      const invalidLiteral = {
        kind: Kind.STRING,
        value
      };

      test(`errors when parsing invalid literal ${stringify(invalidLiteral)}`, () => {
        expect(() => DateTimeScalar.parseLiteral(invalidLiteral, {})).toThrowErrorMatchingSnapshot();
      });
    });

    [
      {
        kind: Kind.FLOAT,
        value: '5'
      },
      {
        kind: Kind.BOOLEAN,
        value: false
      }
    ].forEach(literal => {
      test(`errors when parsing invalid literal ${stringify(literal)}`, () => {
        expect(() => DateTimeScalar.parseLiteral(literal, {})).toThrowErrorMatchingSnapshot();
      });
    });
  });
});

describe('DateTime integration', () => {
  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        validDate: {
          type: DateTimeScalar,
          resolve: () => new Date('2016-05-02T10:31:42.2Z')
        },
        invalidDate: {
          type: DateTimeScalar,
          resolve: () => new Date('wrong')
        },
        invalidType: {
          type: DateTimeScalar,
          resolve: () => '2020-01-01'
        },
        input: {
          type: DateTimeScalar,
          args: {
            date: {
              type: DateTimeScalar
            }
          },
          resolve: (_, input) => input.date
        }
      }
    })
  });

  test('executes a query that includes a DateTime', async () => {
    const query = `
       query DateTest($date: DateTime!) {
         validDate
         input(date: $date)
         inputNull: input
       }
     `;

    const variables = { date: '2017-10-01T00:00:00Z' };

    const response = await graphql(schema, query, null, null, variables);

    expect(response).toEqual({
      data: {
        validDate: '2016-05-02T10:31:42.200Z',
        input: '2017-10-01T00:00:00.000Z',
        inputNull: null
      }
    });
  });

  test('shifts an input date-time to UTC', async () => {
    const query = `
       query DateTest($date: DateTime!) {
         input(date: $date)
       }
     `;

    const variables = { date: '2016-02-01T00:00:00-11:00' };

    const response = await graphql(schema, query, null, null, variables);

    expect(response).toEqual({
      data: {
        input: '2016-02-01T11:00:00.000Z'
      }
    });
  });

  test('parses input to a JS Date', () => {
    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          input: {
            type: DateTimeScalar,
            args: {
              date: {
                type: DateTimeScalar
              }
            },
            resolve: async (_, input) => {
              expect(input.date).toEqual(new Date(Date.UTC(2016, 1, 1, 0, 0, 15)));
            }
          }
        }
      })
    });

    const query = `
       query DateTest($date: DateTime!) {
         input(date: $date)
       }
     `;
    const variables = { date: '2016-02-01T00:00:15Z' };

    graphql(schema, query, null, null, variables);
  });

  test('errors if an invalid date-time is returned from the resolver', async () => {
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
        invalidType: null
      },
      errors: [
        new GraphQLError('DateTime cannot represent an invalid Date instance'),
        new GraphQLError('DateTime cannot represent non-date type')
      ]
    });
  });

  test('errors if the variable value is not a valid date-time', async () => {
    const query = `
       query DateTest($date: DateTime!) {
         input(date: $date)
       }
     `;

    const variables = { date: '2017-10-001T00:00:00Z' };

    const response = await graphql(schema, query, null, null, variables);

    expect(response).toEqual({
      errors: [
        new GraphQLError(
          'Variable "$date" got invalid value "2017-10-001T00:00:00Z"; Expected type DateTime. DateTime cannot represent an invalid date-time-string 2017-10-001T00:00:00Z.'
        )
      ]
    });
  });

  test('errors if the variable value is not of type string', async () => {
    const query = `
       query DateTest($date: DateTime!) {
         input(date: $date)
       }
     `;

    const variables = { date: 4 };

    const response = await graphql(schema, query, null, null, variables);

    expect(response).toEqual({
      errors: [
        new GraphQLError(
          'Variable "$date" got invalid value 4; Expected type DateTime. DateTime cannot represent non string type 4'
        )
      ]
    });
  });

  test('errors if the literal input value is not a valid date-time', async () => {
    const query = `
       {
         input(date: "2017-10-001T00:00:00")
       }
     `;

    const response = await graphql(schema, query);

    expect(response).toEqual({
      errors: [
        new GraphQLError(
          'Expected type DateTime, found "2017-10-001T00:00:00"; DateTime cannot represent an invalid date-time-string 2017-10-001T00:00:00.'
        )
      ]
    });
  });

  test('errors if the literal input value in a query is not a string', async () => {
    const query = `
       {
         input(date: 4)
       }
     `;

    const response = await graphql(schema, query);

    expect(response).toEqual({
      errors: [new GraphQLError('Expected type DateTime, found 4; DateTime cannot represent non string type IntValue')]
    });
  });
});
