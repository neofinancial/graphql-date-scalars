import { GraphQLScalarType } from 'graphql';

export class GraphQLDateScalarType extends GraphQLScalarType<Date, string> {
  serialize: GraphQLScalarSerializer<unknown, string> = this.toConfig().serialize;
  parseValue: GraphQLScalarValueParser<unknown, Date> = this.toConfig().parseValue;
}

export type GraphQLScalarSerializer<TIn, TOut> = (value: TIn) => TOut;
export type GraphQLScalarValueParser<TIn, TOut> = (value: TIn) => TOut;
