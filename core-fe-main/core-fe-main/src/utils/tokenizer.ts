/* eslint-disable */
import { TokenType, type LexerStream } from './types';

export function getNextToken({ match, skip, prev }: LexerStream): TokenType {
  if (prev !== TokenType.QuoteStart && match(/^"/, true)) {
    if (prev === TokenType.String) {
      return TokenType.DoubleQuoteEnd;
    } else if (prev === TokenType.DoubleQuoteStart) {
      return TokenType.EmptyStringAndDoubleQuoteEnd;
    } else {
      return TokenType.DoubleQuoteStart;
    }
  }

  if (match(/^'/, true)) {
    if (prev === TokenType.String) {
      return TokenType.QuoteEnd;
    } else if (prev === TokenType.QuoteStart) {
      return TokenType.EmptyStringAndQuoteEnd;
    } else {
      return TokenType.QuoteStart;
    }
  }

  if (prev === TokenType.DoubleQuoteStart) {
    if (match(/^([^"\\]|\\.)+(?=")/, false)) {
      match(/^([^"\\]|\\.)+(?=")/, true);
      return TokenType.String;
    } else {
      match(/^([^"\\]|\\.)+/, true);
      return TokenType.String;
    }
  }

  if (prev === TokenType.QuoteStart) {
    if (match(/^([^'\\]|\\.)+(?=')/, false)) {
      match(/^([^'\\]|\\.)+(?=')/, true);
      return TokenType.String;
    } else {
      match(/^([^'\\]|\\.)+/, true);
      return TokenType.String;
    }
  }

  const numberRegex = /^\d*\.?\d+/;
  if (match(numberRegex, true)) {
    return TokenType.Number;
  }

  if (match(/^if\s*\(.*\)+\s*{(.|\s)*}/, false)) {
    if (match(/if/, true)) {
      return TokenType.IfCondition;
    }
  }

  if (match(/^else if\s*\(.*\)+\s*{(.|\s)*}/, false)) {
    if (match(/else if/, true)) {
      return TokenType.ElseIfCondition;
    }
  }

  if (match(/^else\s*\{([^\(\)]|\s)*\}/, false)) {
    if (match(/else/, true)) {
      return TokenType.ElseCondition;
    }
  }

  if (match(/^{/, true)) {
    return TokenType.ConditionBracketStart;
  }
  if (match(/^}/, true)) {
    return TokenType.ConditionBracketEnd;
  }
  if (match(/^return(?=\s*\[)/, true)) {
    return TokenType.ReturnKeyword;
  }

  if (prev === TokenType.ReferenceVariableStart) {
    if (match(/^\w+/, true)) {
      return TokenType.ReferenceName;
    }
  }

  const rest: [RegExp, TokenType][] = [
    [/^(<=|==|>=)/, TokenType.Operator],
    [/^[+\-*/^<=>&]/, TokenType.Operator],
    [/^(and|or)(?=\s+)/i, TokenType.Operator],
    [/^[a-zA-Z][a-zA-Z0-9]*(?=\s*\()/, TokenType.FunctionName],
    [/^\(/, TokenType.BracketStart],
    [/^\)/, TokenType.BracketEnd],
    [/^\[/, TokenType.SquareBracketStart],
    [/^\]/, TokenType.SquareBracketEnd],
    [/^\$/, TokenType.ReferenceVariableStart],
    [/^,/, TokenType.Comma],
    [/^\s+/, TokenType.Whitespace],
  ];

  for (const [pattern, type] of rest) {
    if (match(pattern, true)) {
      return type;
    }
  }

  skip();
  return TokenType.Error;
}
