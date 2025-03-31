import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class WebpTransformInterceptor implements NestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // 프로덕션 환경에서는 처리하지 않음
    if (process.env.NODE_ENV === 'production') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const file = request.file;

    // 파일이 없거나 이미지가 아니면 건너뛰기
    if (!file || !file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
      return next.handle();
    }

    try {
      // 원본 파일 경로
      const originalPath = file.path;

      // WebP 파일명 생성 (확장자가 이미 .webp인지 확인)
      let webpPath = originalPath;
      if (!originalPath.endsWith('.webp')) {
        const ext = path.extname(originalPath);
        const basePath = originalPath.substring(
          0,
          originalPath.length - ext.length,
        );
        webpPath = `${basePath}.webp`;
      }

      // 임시 파일로 WebP 변환 수행
      const tempPath = `${webpPath}.tmp`;

      await sharp(originalPath)
        .webp({
          quality: 80,
          lossless: false,
        })
        .toFile(tempPath);

      // 원본 파일 삭제 후 변환된 파일로 대체
      fs.unlinkSync(originalPath);
      fs.renameSync(tempPath, webpPath);

      // 파일 객체 업데이트
      file.filename = path.basename(webpPath);
      file.path = webpPath;
      file.mimetype = 'image/webp';
    } catch (error) {
      console.error('WebP 변환 중 오류 발생:', error);
      // 변환에 실패하더라도 원본 파일은 유지
    }

    return next.handle();
  }
}
