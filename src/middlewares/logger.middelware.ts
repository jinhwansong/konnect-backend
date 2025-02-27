import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
// morgen
// implements - use를 강제로 만들어야 된다.
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('http');

  use(req: Request, res: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = req;
    // user-agent - 브라우저 종류 버전 os 판별
    const userAgent = req.get('user-agent') || '';
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength} - ${userAgent} ${ip}`,
      );
    });
    next();
  }
}
