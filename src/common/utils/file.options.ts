import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import { BadRequestException } from '@nestjs/common';
dotenv.config();

export const multerFile = () => {
  if (process.env.NODE_ENV === 'production') {
    // s3설정
    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    return {
      storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        key: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(
            null,
            `chat-files/${path.basename(file.originalname, ext)} + ${Date.now()} + ${ext}`,
          );
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 각 파일 당 10mb
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          // 이미지
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          // 문서
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('지원하지 않는 파일 형식입니다.'), false);
        }
      },
    };
  } else {
    // 로컬 개발 환경
    return {
      storage: multer.diskStorage({
        // 업로드 위치
        destination(req, file, cb) {
          cb(null, 'uploads/chat-files/');
        },
        // 파일명 조작
        filename(req, file, cb) {
          const ext = path.extname(file.originalname);
          cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 각 파일 당 10mb
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          // 이미지
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          // 문서
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('지원하지 않는 파일 형식입니다.'), false);
        }
      },
    };
  }
};
// 파일 URL 생성 함수
export const getFileUrl = (file: Express.Multer.File): string => {
  if (process.env.NODE_ENV === 'production') {
    // S3에 업로드된 경우
    return (file as any).location;
  } else {
    // 로컬에 업로드된 경우
    return `${process.env.APP_URL || 'http://localhost:3000'}/uploads/chat-files/${file.filename}`;
  }
};
