import { GraphQLScalarType, ValueNode } from 'graphql';

import { validateDateTime, validateJSDate, serializeDateTime, parseDateTime } from '../utils';
import { isStringValueNode } from '../utils/type-guards';

/**
 * An RFC 3339 compliant date-time scalar.
 *
 * Input:
 *    This scalar takes an RFC 3339 date-time string as input and
 *    parses it to a javascript Date.
 *
 * Output:
 *    This scalar serializes javascript Dates,
 *    RFC 3339 date-time strings and unix timestamps
 *    to RFC 3339 UTC date-time strings.
 */
const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description:
    'A date-time string at UTC, such as 2007-12-03T10:15:30Z, ' +
    'compliant with the `date-time` format outlined in section 5.6 of ' +
    'the RFC 3339 profile of the ISO 8601 standard for representation ' +
    'of dates and times using the Gregorian calendar.',
  serialize(value: Date): string {
    if (validateJSDate(value)) {
      return serializeDateTime(value);
    }

    throw new TypeError('DateTime cannot represent an invalid Date instance');
  },
  parseValue(value: string): Date {
    if (validateDateTime(value)) {
      return parseDateTime(value);
    }

    throw new TypeError(`DateTime cannot represent an invalid date-time-string ${value}.`);
  },
  parseLiteral(ast: ValueNode): Date {
    if (!isStringValueNode(ast)) {
      throw new TypeError(`DateTime cannot represent non string type ${ast.kind}`);
    }

    const { value } = ast;

    if (validateDateTime(value)) {
      return parseDateTime(value);
    }

    throw new TypeError(`DateTime cannot represent an invalid date-time-string ${String(value)}.`);
  },
});

export default dateTimeScalar;
