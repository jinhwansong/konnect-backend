import { createParamDecorator, ExecutionContext } from '@nestjs/common';
// 토큰 내용을 접근가능
export const Token = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const res = ctx.switchToHttp().getResponse();
    return res.locals.jwt;
  },
);
