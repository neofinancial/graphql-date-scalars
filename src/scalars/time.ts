import { ValueNode } from 'graphql';

import { validateTime, validateJSDate, serializeTime, parseTime } from '../utils';
import { isStringValueNode } from '../utils/type-guards';
import { GraphQLDateScalarType } from '../utils/types';

/**
 * An RFC 3339 compliant time scalar.
 *
 * Input:
 *    This scalar takes an RFC 3339 time string as input and
 *    parses it to a javascript Date (with a year-month-day relative
 *    to the current day).
 *
 * Output:
 *    This scalar serializes javascript Dates and
 *    to RFC 3339 UTC time strings.
 */
const timeScalar = new GraphQLDateScalarType({
  name: 'Time',
  description:
    'A time string at UTC, such as 10:15:30Z, compliant with ' +
    'the `full-time` format outlined in section 5.6 of the RFC 3339' +
    'profile of the ISO 8601 standard for representation of dates and ' +
    'times using the Gregorian calendar.',
  serialize(value: unknown): string {
    if (!(value instanceof Date)) {
      throw new TypeError('Time cannot represent non-date type');
    }

    if (validateJSDate(value)) {
      return serializeTime(value);
    }

    throw new TypeError('Time cannot represent an invalid Date instance');
  },
  parseValue(value: unknown): Date {
    if (typeof value !== 'string') {
      throw new TypeError(`Time cannot represent non string type ${JSON.stringify(value)}`);
    }

    if (validateTime(value)) {
      return parseTime(value);
    }

    throw new TypeError(`Time cannot represent an invalid time-string ${value}.`);
  },
  parseLiteral(ast: ValueNode): Date {
    if (!isStringValueNode(ast)) {
      throw new TypeError(`Time cannot represent non string type ${ast.kind}`);
    }

    const value = ast.value;

    if (validateTime(value)) {
      return parseTime(value);
    }

    throw new TypeError(`Time cannot represent an invalid time-string ${String(value)}.`);
  },
});

export { timeScalar as TimeScalar };
