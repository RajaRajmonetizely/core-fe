/* eslint-disable */
export enum TokenType {
  Number = 'Number',
  String = 'String',
  Whitespace = 'Whitespace',
  Operator = 'Operator',
  BracketStart = 'BracketStart',
  BracketEnd = 'BracketEnd',
  ReferenceVariableStart = 'ReferenceVariableStart',
  ReferenceName = 'ReferenceName',
  FunctionName = 'FunctionName',
  Comma = 'Comma',
  QuoteStart = 'QuoteStart',
  QuoteEnd = 'QuoteEnd',
  EmptyStringAndQuoteEnd = 'EmptyStringAndQuoteEnd',
  DoubleQuoteStart = 'DoubleQuoteStart',
  DoubleQuoteEnd = 'DoubleQuoteEnd',
  EmptyStringAndDoubleQuoteEnd = 'EmptyStringAndDoubleQuoteEnd',
  Group = 'Group',
  Error = 'Error',
  IfCondition = 'IfCondition',
  ElseIfCondition = 'ElseIfCondition',
  ElseCondition = 'ElseCondition',
  ConditionBracketStart = 'ConditionBracketStart',
  ConditionBracketEnd = 'ConditionBracketEnd',
  SquareBracketStart = 'SquareBracketStart',
  SquareBracketEnd = 'SquareBracketEnd',
  ReturnKeyword = 'ReturnKeyword',
}

export const operatorAllowedAfter = [
  TokenType.Number,
  TokenType.BracketEnd,
  TokenType.ReferenceName,
  TokenType.QuoteEnd,
  TokenType.DoubleQuoteEnd,
];

export type Token = {
  type: TokenType;
  value: string;
};

export type TokenNode = Token & {
  innerNodes: TokenNode[];
};

export interface LexerStream {
  match: (pattern: RegExp, consume: boolean) => string | undefined;
  skip: () => void;
  prev: TokenType | null;
}

export enum ErrorType {
  UnexpectedOperator = 'UnexpectedOperator',
  ValueRequiredAfterOperator = 'ValueRequiredAfterOperator',
  OperatorRequiredBeforeNumber = 'OperatorRequiredBeforeNumber',
  OperatorRequiredBeforeFunction = 'OperatorRequiredBeforeFunction',
  OperatorRequiredBeforeQuote = 'OperatorRequiredBeforeQuote',
  OperatorRequiredBeforeBracket = 'OperatorRequiredBeforeBracket',
  OperatorRequiredBeforeReference = 'OperatorRequiredBeforeReference',
  InvalidFunction = 'InvalidFunction',
  InvalidCharacter = 'InvalidCharacter',
  UnexpectedComma = 'UnexpectedComma',
  UnexpectedIfCondition = 'UnexpectedIfCondition',
  UnexpectedElseCondition = 'UnexpectedElseCondition',
  UnexpectedElseIfCondition = 'UnexpectedElseIfCondition',
  UnexpectedReturn = 'Unexpected keyword',
  UnexpectedBracket = 'UnexpectedBracket',
  UnexpectedConditionBracket = 'UnexpectedConditionBracket',
  UnexpectedSquareBracket = 'UnexpectedSquareBracket',
  ReferenceNameRequiredInBrackets = 'ReferenceNameRequiredInBrackets',
  UnsupportedReferenceName = 'Column not supported',
  UnclosedQuote = 'UnclosedQuote',
  UnclosedDoubleQuote = 'UnclosedDoubleQuote',
  UnclosedBracket = 'UnclosedBracket',
  UnclosedSqureBracket = 'UnclosedSqureBracket',
  UnclosedReferenceBracket = 'UnclosedReferenceBracket',
  UnclosedIfConditionBracket = 'UnclosedIfConditionBracket',
  UnclosedConditionBracket = 'UnclosedConditionBracket',
  CircularReference = 'CircularReference',
  CircularReferenceToItself = 'CircularReferenceToItself',
  DependsOnInvalid = 'DependsOnInvalid',
  DependsOnCircular = 'DependsOnCircular',
  EmptyIfCondition = 'EmptyIfCondition',
  EmptyElseIfCondition = 'EmptyElseIfCondition',
  EmptyCondition = 'EmptyCondition',
  EmptyVariableName = 'Must Contain variable name after',
  Required = 'Required',
  ReturnWithoutSquareBrackets = `if/ else if/ else should have return statement wrapped by '[]' before `,
}

export type ValidationError = {
  token?: Token;
  tokenIndex?: number;
  errorType: ErrorType;
  message?: string;
};
