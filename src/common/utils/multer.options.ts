import { S3Client } from '@aws-sdk/client-s3';
import { BadRequestException } from '@nestjs/common';
import multer from 'multer';
import path from 'path';
import multerS3 from 'multer-s3';
import dotenv from 'dotenv';
dotenv.config();
console.log('AWS_ACCESS_KEY_ID', process.env.AWS_ACCESS_KEY_ID);
console.log('AWS_SECRET_ACCESS_KEY', process.env.AWS_SECRET_ACCESS_KEY);
export const multerImage = () => {
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
          cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // 각 파일 당 2mb
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('지원하지 않는 이미지 형식입니다'), false);
        }
      },
    };
  } else {
    // 로컬 개발 환경
    return {
      storage: multer.diskStorage({
        // 업로드 위치
        destination(req, file, cb) {
          cb(null, 'uploads/');
        },
        // 파일명 조작
        filename(req, file, cb) {
          const ext = path.extname(file.originalname);
          cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // 각 파일 당 2mb
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('지원하지 않는 이미지 형식입니다'), false);
        }
      },
    };
  }
};
