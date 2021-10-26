import { GraphQLScalarType } from 'graphql';

export class GraphQLDateScalarType extends GraphQLScalarType {
  serialize: GraphQLScalarSerializer<Date, string> = this.toConfig().serialize;
  parseValue: GraphQLScalarValueParser<string, Date> = this.toConfig().parseValue;
}

export type GraphQLScalarSerializer<TIn, TOut> = (value: TIn) => TOut | undefined;
export type GraphQLScalarValueParser<TIn, TOut> = (value: TIn) => TOut | undefined;
