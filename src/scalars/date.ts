import { ValueNode } from 'graphql';

import { validateJSDate, serializeDate, validateDate, parseDate } from '../utils';
import { isStringValueNode } from '../utils/type-guards';
import { GraphQLDateScalarType } from '../utils/types';

/**
 * An RFC 3339 compliant date-time scalar.
 *
 * Input:
 *    This scalar takes an RFC 3339 date-time string as input and
 *    parses it to a javascript Date.
 *
 * Output:
 *    This scalar serializes javascript Dates,
 *    to RFC 3339 UTC date-time strings.
 */
const dateScalar = new GraphQLDateScalarType({
  name: 'Date',
  description:
    'A date string, such as 2007-12-03, compliant with the `full-date` ' +
    'format outlined in section 5.6 of the RFC 3339 profile of the ' +
    'ISO 8601 standard for representation of dates and times using ' +
    'the Gregorian calendar.',
  serialize(value: unknown): string {
    if (!(value instanceof Date)) {
      throw new TypeError('Date cannot represent non-date type');
    }

    if (validateJSDate(value)) {
      return serializeDate(value);
    }

    throw new TypeError('Date cannot represent an invalid Date instance');
  },
  parseValue(value: unknown): Date {
    if (typeof value !== 'string') {
      throw new TypeError(`Date cannot represent non string type ${JSON.stringify(value)}`);
    }

    const trimmedValue = value.split('T')[0];

    if (validateDate(trimmedValue)) {
      return parseDate(trimmedValue);
    }

    throw new TypeError(`Date cannot represent an invalid date-string ${value}.`);
  },
  parseLiteral(ast: ValueNode): Date {
    if (!isStringValueNode(ast)) {
      throw new TypeError(`Date cannot represent non string type ${ast.kind}`);
    }

    const { value } = ast;
    const trimmedValue = value.split('T')[0];

    if (validateDate(trimmedValue)) {
      return parseDate(trimmedValue);
    }

    throw new TypeError(`Date cannot represent an invalid date-string ${String(value)}.`);
  },
});

export { dateScalar as DateScalar };
