/* eslint-disable */
import { functionIsSupported } from './suppotedFunctions';
import {
  ErrorType,
  TokenType,
  operatorAllowedAfter,
  type Token,
  type ValidationError,
} from './types';

const operatorRequiredMap: Partial<Record<TokenType, ErrorType>> = {
  [TokenType.Number]: ErrorType.OperatorRequiredBeforeNumber,
  [TokenType.FunctionName]: ErrorType.OperatorRequiredBeforeFunction,
  [TokenType.QuoteStart]: ErrorType.OperatorRequiredBeforeQuote,
  [TokenType.DoubleQuoteStart]: ErrorType.OperatorRequiredBeforeQuote,
};

const startToEndMap: Partial<Record<TokenType, TokenType>> = {
  [TokenType.QuoteEnd]: TokenType.QuoteStart,
  [TokenType.DoubleQuoteEnd]: TokenType.DoubleQuoteStart,
};

const valueAllowedAfter = [TokenType.Operator, TokenType.Comma, TokenType.BracketStart];

const unclosedErrorMap: Partial<Record<TokenType, ErrorType>> = {
  [TokenType.QuoteStart]: ErrorType.UnclosedQuote,
  [TokenType.DoubleQuoteStart]: ErrorType.UnclosedDoubleQuote,
  [TokenType.FunctionName]: ErrorType.UnclosedBracket,
  [TokenType.Group]: ErrorType.UnclosedBracket,
  [TokenType.ReferenceName]: ErrorType.UnclosedReferenceBracket,
  [TokenType.IfCondition]: ErrorType.UnclosedIfConditionBracket,
  [TokenType.ConditionBracketStart]: ErrorType.UnclosedConditionBracket,
  [TokenType.ReferenceVariableStart]: ErrorType.EmptyVariableName,
  [TokenType.SquareBracketStart]: ErrorType.UnclosedSqureBracket,
};

const getUnclosedBracketType = (prevToken: Token | null): TokenType => {
  if (prevToken?.type === TokenType.FunctionName) {
    return TokenType.FunctionName;
  } else if (prevToken?.type === TokenType.IfCondition) {
    return TokenType.IfCondition;
  } else if (prevToken?.type === TokenType.ElseIfCondition) {
    return TokenType.ElseIfCondition;
  }
  return TokenType.Group;
};

export function getValidationErrors(tokens: Token[], supportedRefs?: string[]) {
  const errors: ValidationError[] = [];
  const unclosedTokens: { token: Token; tokenIndex: number; type: TokenType }[] = [];

  const supportedRefsLowerCase = supportedRefs?.map((ref) => ref.toLowerCase());
  let ifConditionTokens: number[] = [];
  let requiredMissingTokens: { token: Token; tokenType: TokenType; errorType: ErrorType }[] = [];
  let conditionalBracketTokens: TokenType[] = [];
  let functionLevel = 0;
  let prev: Token | null = null;
  let prevIndex = 0;

  for (let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
    const addError = (errorType: ErrorType) => errors.push({ token, tokenIndex, errorType });

    const token = tokens[tokenIndex];

    if (token.type === TokenType.Operator) {
      if (!prev || !operatorAllowedAfter.includes(prev.type)) {
        addError(ErrorType.UnexpectedOperator);
      }
    }

    if (
      operatorRequiredMap[token.type] &&
      prev &&
      ![
        ...valueAllowedAfter,
        TokenType.SquareBracketStart,
        TokenType.ConditionBracketStart,
      ].includes(prev.type)
    ) {
      addError(operatorRequiredMap[token.type] as ErrorType);
    }

    if (token.type === TokenType.FunctionName) {
      if (!functionIsSupported(token.value)) {
        addError(ErrorType.InvalidFunction);
      } else if (token.value.toLocaleLowerCase() === 'lookup') {
        conditionalBracketTokens.push(TokenType.FunctionName);
      }
    }

    if ([TokenType.QuoteStart, TokenType.DoubleQuoteStart].includes(token.type)) {
      unclosedTokens.push({ token, tokenIndex, type: token.type });
    }

    if (startToEndMap[token.type]) {
      if (
        unclosedTokens.length &&
        unclosedTokens[unclosedTokens.length - 1].token.type === startToEndMap[token.type]
      ) {
        unclosedTokens.pop();
      }
    }

    if (token.type === TokenType.Comma) {
      if (
        (functionLevel <= 0 &&
          unclosedTokens[unclosedTokens.length - 1].token.type !== TokenType.SquareBracketStart) ||
        !prev ||
        !operatorAllowedAfter.includes(prev.type)
      ) {
        addError(ErrorType.UnexpectedComma);
      }
    }

    if (token.type === TokenType.IfCondition) {
      conditionalBracketTokens.push(TokenType.IfCondition);
      if (prev && prev.type !== TokenType.ConditionBracketStart) {
        addError(ErrorType.UnexpectedIfCondition);
      }
    }

    if (token.type === TokenType.ElseIfCondition) {
      conditionalBracketTokens.push(TokenType.ElseIfCondition);
      if (!prev || prev.type !== TokenType.ConditionBracketEnd) {
        addError(ErrorType.UnexpectedElseIfCondition);
      }
    }

    if (token.type === TokenType.ElseCondition) {
      conditionalBracketTokens.push(TokenType.ElseCondition);
      if (
        requiredMissingTokens[requiredMissingTokens.length - 1]?.tokenType ===
        TokenType.ElseCondition
      ) {
        requiredMissingTokens.pop();
      }

      if (!prev || prev.type !== TokenType.ConditionBracketEnd) {
        addError(ErrorType.UnexpectedElseCondition);
      }
    }

    if (token.type === TokenType.ReturnKeyword) {
      if (!prev || prev.type !== TokenType.ConditionBracketStart) {
        addError(ErrorType.UnexpectedReturn);
      }
    }

    if (token.type === TokenType.ConditionBracketStart) {
      unclosedTokens.push({ token, tokenIndex, type: TokenType.ConditionBracketStart });
      if (!prev || ![TokenType.BracketEnd, TokenType.ElseCondition].includes(prev.type)) {
        addError(ErrorType.UnexpectedConditionBracket);
      }
    }

    if (token.type === TokenType.ConditionBracketEnd) {
      const lastConditionalBracketToken = conditionalBracketTokens.pop() || TokenType.Error;
      if (
        unclosedTokens.length &&
        unclosedTokens[unclosedTokens.length - 1].type === TokenType.ConditionBracketStart
      ) {
        unclosedTokens.pop();
        if (!prev || prev?.type === TokenType.ConditionBracketStart) {
          addError(ErrorType.EmptyCondition);
        } else if (
          [TokenType.IfCondition, TokenType.ElseIfCondition, TokenType.ElseCondition].includes(
            lastConditionalBracketToken,
          ) &&
          prev?.type !== TokenType.SquareBracketEnd
        ) {
          addError(ErrorType.ReturnWithoutSquareBrackets);
        }
      } else {
        addError(ErrorType.UnexpectedConditionBracket);
      }
    }

    if (token.type === TokenType.Error) {
      addError(ErrorType.InvalidCharacter);
    }

    if (token.type === TokenType.BracketStart) {
      unclosedTokens.push({ token, tokenIndex, type: getUnclosedBracketType(prev) });

      if (prev?.type === TokenType.IfCondition) {
        ifConditionTokens.push(tokenIndex - 1);
      }
      if (prev?.type === TokenType.ElseIfCondition) {
        ifConditionTokens.push(tokenIndex - 1);
      }
      if (prev?.type === TokenType.FunctionName) {
        functionLevel++;
      } else if (
        prev &&
        ![
          ...valueAllowedAfter,
          TokenType.IfCondition,
          TokenType.ElseIfCondition,
          TokenType.ConditionBracketStart,
        ].includes(prev.type)
      ) {
        addError(ErrorType.OperatorRequiredBeforeBracket);
      }
    }

    if (token.type === TokenType.BracketEnd) {
      if (
        unclosedTokens.length &&
        unclosedTokens[unclosedTokens.length - 1].type === TokenType.FunctionName
      ) {
        functionLevel--;
        unclosedTokens.pop();
        if (!prev || !operatorAllowedAfter.includes(prev.type)) {
          addError(ErrorType.UnexpectedBracket);
        }
      } else if (
        unclosedTokens.length &&
        unclosedTokens[unclosedTokens.length - 1].type === TokenType.IfCondition
      ) {
        unclosedTokens.pop();
        ifConditionTokens.pop();
        if (prev && prev.type === TokenType.BracketStart) {
          addError(ErrorType.EmptyIfCondition);
        }
        if (
          !prev ||
          (!operatorAllowedAfter.includes(prev.type) && prev.type !== TokenType.BracketStart)
        ) {
          addError(ErrorType.UnexpectedBracket);
        }
      } else if (
        unclosedTokens.length &&
        unclosedTokens[unclosedTokens.length - 1].type === TokenType.ElseIfCondition
      ) {
        unclosedTokens.pop();
        ifConditionTokens.pop();
        if (prev && prev.type === TokenType.BracketStart) {
          addError(ErrorType.EmptyElseIfCondition);
        }
        if (
          !prev ||
          (!operatorAllowedAfter.includes(prev.type) && prev.type !== TokenType.BracketStart)
        ) {
          addError(ErrorType.UnexpectedBracket);
        }
      } else if (
        unclosedTokens.length &&
        unclosedTokens[unclosedTokens.length - 1].type === TokenType.Group
      ) {
        unclosedTokens.pop();
        if (
          !prev ||
          (!operatorAllowedAfter.includes(prev.type) && prev.type !== TokenType.BracketStart)
        ) {
          addError(ErrorType.UnexpectedBracket);
        }
      } else {
        addError(ErrorType.UnexpectedBracket);
      }
    }

    if (token.type === TokenType.SquareBracketStart) {
      unclosedTokens.push({ token, tokenIndex, type: TokenType.SquareBracketStart });
      if (!prev || prev.type !== TokenType.ReturnKeyword) {
        addError(ErrorType.UnexpectedSquareBracket);
      }
    }

    if (token.type === TokenType.SquareBracketEnd) {
      if (
        unclosedTokens.length &&
        unclosedTokens[unclosedTokens.length - 1].type === TokenType.SquareBracketStart
      ) {
        unclosedTokens.pop();
        if (!prev || !operatorAllowedAfter.includes(prev.type)) {
          addError(ErrorType.UnexpectedSquareBracket);
        }
      } else {
        addError(ErrorType.UnexpectedSquareBracket);
      }
    }

    if (token.type === TokenType.ReferenceVariableStart) {
      unclosedTokens.push({ token, tokenIndex, type: TokenType.ReferenceVariableStart });
      if (
        prev &&
        ![
          ...valueAllowedAfter,
          TokenType.SquareBracketStart,
          TokenType.ConditionBracketStart,
        ].includes(prev.type)
      ) {
        addError(ErrorType.OperatorRequiredBeforeReference);
      }
    }

    if (token.type === TokenType.ReferenceName && token.value) {
      if (
        ifConditionTokens.length > 0 &&
        requiredMissingTokens[requiredMissingTokens.length - 1]?.tokenType !==
          TokenType.ElseCondition
      ) {
        requiredMissingTokens.push({
          token: tokens[ifConditionTokens[ifConditionTokens.length - 1]],
          tokenType: TokenType.ElseCondition,
          errorType: ErrorType.Required,
        });
      }

      if (supportedRefsLowerCase?.includes(token.value.toLowerCase())) {
        unclosedTokens.pop();
      } else {
        unclosedTokens.pop();
        addError(ErrorType.UnsupportedReferenceName);
      }
    }

    if (token.type !== TokenType.Whitespace) {
      prev = token;
      prevIndex = tokenIndex;
    }
  }

  if (prev?.type === TokenType.Operator) {
    errors.push({
      token: prev,
      tokenIndex: prevIndex,
      errorType: ErrorType.ValueRequiredAfterOperator,
    });
  }

  unclosedTokens.forEach(({ token, tokenIndex, type }) => {
    if (unclosedErrorMap[type]) {
      errors.push({ token, tokenIndex, errorType: unclosedErrorMap[type] as ErrorType });
    }
  });

  requiredMissingTokens.forEach((requiredMissingToken) => {
    errors.push({
      token: requiredMissingToken.token,
      tokenIndex: -1,
      errorType: requiredMissingToken.errorType,
      message: `${requiredMissingToken.errorType} "${requiredMissingToken.tokenType}" for "${requiredMissingToken.token?.value}"`,
    });
  });
  return errors;
}
