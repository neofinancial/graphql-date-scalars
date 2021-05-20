import { Kind, StringValueNode, ValueNode } from 'graphql';

const isStringValueNode = (ast: ValueNode): ast is StringValueNode => {
  return ast.kind === Kind.STRING;
};

export { isStringValueNode };
