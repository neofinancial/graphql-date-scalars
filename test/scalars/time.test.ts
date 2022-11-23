/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  graphql,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLError,
  Kind,
  StringValueNode,
  FloatValueNode,
  BooleanValueNode,
} from 'graphql';
import { stringify } from 'jest-matcher-utils';
import MockDate from 'mockdate';

import { TimeScalar } from '../../src/scalars/time';

// Mock the new Date() call so it always returns 2017-01-01T00:00:00.000Z
MockDate.set(new Date(Date.UTC(2017, 0, 1)));

describe('Time scalar', () => {
  const invalidDates = ['Invalid date', '2016-01-01T00:00:00.223Z', '10:30:02.Z', '00:00:00.45+0130', '00:00:00.45+01'];

  const validDates: [string, Date][] = [
    ['00:00:00Z', new Date(Date.UTC(2017, 0, 1))],
    ['00:00:59Z', new Date(Date.UTC(2017, 0, 1, 0, 0, 59))],
    ['10:30:02.1Z', new Date(Date.UTC(2017, 0, 1, 10, 30, 2, 100))],
    ['09:09:06.13Z', new Date(Date.UTC(2017, 0, 1, 9, 9, 6, 130))],
    ['10:00:11.003Z', new Date(Date.UTC(2017, 0, 1, 10, 0, 11, 3))],
    ['16:10:20.1359945Z', new Date(Date.UTC(2017, 0, 1, 16, 10, 20, 135))],
    ['00:00:00+01:30', new Date(Date.UTC(2016, 11, 31, 22, 30))],
    ['00:00:30.3-01:30', new Date(Date.UTC(2017, 0, 1, 1, 30, 30, 300))],
  ];

  test('has a description', () => {
    expect(TimeScalar.description).toMatchSnapshot();
  });

  describe('serialization', () => {
    [{}, [], null, undefined, true].forEach((invalidInput) => {
      test(`throws error when serializing ${stringify(invalidInput)}`, () => {
        expect(() => TimeScalar.serialize(invalidInput)).toThrowErrorMatchingSnapshot();
      });
    });

    // Serialize from Date
    [
      [new Date(Date.UTC(2016, 0, 1)), '00:00:00.000Z'],
      [new Date(Date.UTC(2016, 0, 1, 14, 48, 10, 3)), '14:48:10.003Z'],
    ].forEach(([value, expected]) => {
      test(`serializes javascript Date ${stringify(value)} into ${stringify(expected)}`, () => {
        expect(TimeScalar.serialize(value)).toEqual(expected);
      });
    });

    test(`throws error when serializing invalid date`, () => {
      expect(() => TimeScalar.serialize(new Date('invalid date'))).toThrowErrorMatchingSnapshot();
    });

    invalidDates.forEach((dateString) => {
      test(`throws an error when serializing an invalid date-string ${stringify(dateString)}`, () => {
        expect(() => TimeScalar.serialize(dateString)).toThrowErrorMatchingSnapshot();
      });
    });
  });

  describe('value parsing', () => {
    validDates.forEach(([value, expected]) => {
      test(`parses date-string ${stringify(value)} into javascript Date ${stringify(expected)}`, () => {
        expect(TimeScalar.parseValue(value)).toEqual(expected);
      });
    });

    [4566, {}, [], true, null].forEach((invalidInput) => {
      test(`throws an error when parsing ${stringify(invalidInput)}`, () => {
        expect(() => TimeScalar.parseValue(invalidInput)).toThrowErrorMatchingSnapshot();
      });
    });

    invalidDates.forEach((dateString) => {
      test(`throws an error parsing an invalid time-string ${stringify(dateString)}`, () => {
        expect(() => TimeScalar.parseValue(dateString)).toThrowErrorMatchingSnapshot();
      });
    });
  });

  describe('literial parsing', () => {
    validDates.forEach(([value, expected]) => {
      const literal: StringValueNode = {
        kind: Kind.STRING,
        value,
      };

      test(`parses literal ${stringify(literal)} into javascript Date ${stringify(expected)}`, () => {
        expect(TimeScalar.parseLiteral(literal, {})).toEqual(expected);
      });
    });

    invalidDates.forEach((value) => {
      const invalidLiteral: StringValueNode = {
        kind: Kind.STRING,
        value,
      };

      test(`errors when parsing invalid literal ${stringify(invalidLiteral)}`, () => {
        expect(() => TimeScalar.parseLiteral(invalidLiteral, {})).toThrowErrorMatchingSnapshot();
      });
    });

    [
      {
        kind: Kind.FLOAT,
        value: '5',
      } as FloatValueNode,
      {
        kind: Kind.BOOLEAN,
        value: false,
      } as BooleanValueNode,
    ].forEach((literal) => {
      test(`errors when parsing invalid literal ${stringify(literal)}`, () => {
        expect(() => TimeScalar.parseLiteral(literal, {})).toThrow();
      });
    });
  });
});

describe('Time integration', () => {
  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        validJSDate: {
          type: TimeScalar,
          resolve: () => new Date(Date.UTC(2016, 0, 1, 14, 48, 10, 3)),
        },
        invalidJSDate: {
          type: TimeScalar,
          resolve: () => new Date('wrong'),
        },
        invalidType: {
          type: TimeScalar,
          resolve: () => 5,
        },
        input: {
          type: TimeScalar,
          args: {
            time: {
              type: TimeScalar,
            },
          },
          resolve: (_, input) => input.time,
        },
      },
    }),
  });

  test('executes a query that includes a time', async () => {
    const source = `
     query TimeTest($time: Time!) {
       validJSDate
       input(time: $time)
       inputNull: input
     }
   `;

    const variableValues = { time: '14:30:00Z' };

    const response = await graphql({ schema, source, variableValues });

    expect(response).toEqual({
      data: {
        validJSDate: '14:48:10.003Z',
        input: '14:30:00.000Z',
        inputNull: null,
      },
    });
  });

  test('shifts an input time to UTC', async () => {
    const source = `
     query TimeTest($time: Time!) {
       input(time: $time)
     }
   `;

    const variableValues = { time: '00:00:00+01:30' };

    const response = await graphql({ schema, source, variableValues });

    expect(response).toEqual({
      data: {
        input: '22:30:00.000Z',
      },
    });
  });

  test('parses input to a JS Date', () => {
    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          input: {
            type: TimeScalar,
            args: {
              time: {
                type: TimeScalar,
              },
            },
            resolve: (_, input) => {
              expect(input.time).toEqual(new Date(Date.UTC(2016, 11, 31, 22, 30)));
            },
          },
        },
      }),
    });

    const source = `
     query TimeTest($time: Time!) {
       input(time: $time)
     }
   `;

    const variableValues = { time: '00:00:00+01:30' };

    graphql({ schema, source, variableValues });
  });

  test('errors if there is an invalid time returned from the resolver', async () => {
    const source = `
     {
       invalidJSDate
       invalidType
     }
   `;

    const response = await graphql({ schema, source });

    expect(response).toEqual({
      data: {
        invalidJSDate: null,
        invalidType: null,
      },
      errors: [
        new GraphQLError('Time cannot represent an invalid Date instance'),
        new GraphQLError('Time cannot represent non-date type'),
      ],
    });
  });

  test('errors if the variable value is not a valid time', async () => {
    const source = `
     query TimeTest($time: Time!) {
       input(time: $time)
     }
   `;

    const variableValues = { time: '__2222' };

    const response = await graphql({ schema, source, variableValues });

    expect(response).toEqual({
      errors: [
        new GraphQLError(
          'Variable "$time" got invalid value "__2222"; Expected type "Time". Time cannot represent an invalid time-string __2222.'
        ),
      ],
    });
  });

  test('errors if the variable value is not of type string', async () => {
    const source = `
     query DateTest($time: Time!) {
       input(time: $time)
     }
   `;

    const variableValues = { time: 4 };

    const response = await graphql({ schema, source, variableValues });

    expect(response).toEqual({
      errors: [
        new GraphQLError(
          'Variable "$time" got invalid value 4; Expected type "Time". Time cannot represent non string type 4'
        ),
      ],
    });
  });

  test('errors if the literal input value is not a valid time', async () => {
    const source = `
     {
       input(time: "__invalid__")
     }
   `;

    const response = await graphql({ schema, source });

    expect(response).toEqual({
      errors: [
        new GraphQLError(
          'Expected value of type "Time", found "__invalid__"; Time cannot represent an invalid time-string __invalid__.'
        ),
      ],
    });
  });

  test('errors if the literal input value in a query is not a string', async () => {
    const source = `
     {
       input(time: 4)
     }
   `;

    const response = await graphql({ schema, source });

    expect(response).toEqual({
      errors: [
        new GraphQLError('Expected value of type "Time", found 4; Time cannot represent non string type IntValue'),
      ],
    });
  });
});
