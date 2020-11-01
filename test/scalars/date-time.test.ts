import { Kind } from 'graphql';

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

  it('has a description', () => {
    expect(DateTimeScalar.description).toMatchSnapshot();
  });

  describe('serialization', () => {
    [{}, [], null, undefined, true].forEach(invalidInput => {
      it(`throws error when serializing ${stringify(invalidInput)}`, () => {
        expect(() => DateTimeScalar.serialize(invalidInput)).toThrowErrorMatchingSnapshot();
      });
    });

    [
      [new Date(Date.UTC(2016, 0, 1)), '2016-01-01T00:00:00.000Z'],
      [new Date(Date.UTC(2016, 0, 1, 14, 48, 10, 30)), '2016-01-01T14:48:10.030Z']
    ].forEach(([value, expected]) => {
      it(`serializes javascript Date ${stringify(value)} into ${stringify(expected)}`, () => {
        expect(DateTimeScalar.serialize(value)).toEqual(expected);
      });
    });

    it(`throws error when serializing invalid date`, () => {
      expect(() => DateTimeScalar.serialize(new Date('invalid date'))).toThrowErrorMatchingSnapshot();
    });
  });

  describe('value parsing', () => {
    validDates.forEach(([value, expected]) => {
      it(`parses date-string ${stringify(value)} into javascript Date ${stringify(expected)}`, () => {
        expect(DateTimeScalar.parseValue(value)).toEqual(expected);
      });
    });

    [4566, {}, [], true, null].forEach(invalidInput => {
      it(`throws an error when parsing ${stringify(invalidInput)}`, () => {
        expect(() => DateTimeScalar.parseValue(invalidInput)).toThrowErrorMatchingSnapshot();
      });
    });

    invalidDates.forEach(dateString => {
      it(`throws an error parsing an invalid date-string ${stringify(dateString)}`, () => {
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

      it(`parses literal ${stringify(literal)} into javascript Date ${stringify(expected)}`, () => {
        expect(DateTimeScalar.parseLiteral(literal, {})).toEqual(expected);
      });
    });

    invalidDates.forEach(value => {
      const invalidLiteral = {
        kind: Kind.STRING,
        value
      };

      it(`errors when parsing invalid literal ${stringify(invalidLiteral)}`, () => {
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
      it(`errors when parsing invalid literal ${stringify(literal)}`, () => {
        expect(() => DateTimeScalar.parseLiteral(literal, {})).toThrowErrorMatchingSnapshot();
      });
    });
  });
});
