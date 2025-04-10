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

      // 파일명과 확장자 분리
      const parsedPath = path.parse(originalPath);

      // 원본 파일명에서 확장자를 제거
      const nameWithoutExt = parsedPath.name.replace(
        /\.(jpg|jpeg|png|gif)$/,
        '',
      );
      console.log('확장자 제거', nameWithoutExt);
      // WebP 파일 경로 생성
      const webpPath = path.join(parsedPath.dir, `${nameWithoutExt}.webp`);

      // 디버깅: 파일 경로 로깅
      console.log('원본 경로:', originalPath);
      console.log('변환 경로:', webpPath);

      // WebP 변환 수행
      await sharp(originalPath)
        .webp({
          quality: 80,
          lossless: false,
        })
        .toFile(webpPath);

      // 파일 객체 업데이트 (원본 파일 삭제 전에 수행)
      file.filename = path.basename(webpPath);
      file.path = webpPath;
      file.mimetype = 'image/webp';

      // 원본 확장자가 있다면 originalname도 업데이트
      if (file.originalname) {
        file.originalname = file.originalname.replace(
          /\.(jpg|jpeg|png|gif)$/,
          '.webp',
        );
      }

      // 파일 핸들이 완전히 닫히도록 잠시 기다림
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 원본 파일 삭제 시도 (오류 발생 시 무시)
      try {
        if (fs.existsSync(originalPath)) {
          fs.unlinkSync(originalPath);
          console.log('원본 파일 삭제 성공:', originalPath);
        }
      } catch (deleteError) {
        console.warn(
          '원본 파일 삭제 중 오류 (계속 진행):',
          deleteError.message,
        );
        // 나중에 정리를 위해 삭제 실패한 파일 목록 기록 가능
      }

      // 디버깅: 최종 파일 정보 로깅
      console.log('변환 완료. 파일 정보:', {
        filename: file.filename,
        path: file.path,
        originalname: file.originalname,
        mimetype: file.mimetype,
      });
    } catch (error) {
      console.error('WebP 변환 중 오류 발생:', error);
      console.error(error.stack);
      // 변환 실패 시 원본 파일을 그대로 사용
    }

    return next.handle();
  }
}
