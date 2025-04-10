import { S3Client } from '@aws-sdk/client-s3';
import { BadRequestException } from '@nestjs/common';
import multer from 'multer';
import path from 'path';
import multerS3 from 'multer-s3';
import dotenv from 'dotenv';
import sharp from 'sharp';

dotenv.config();
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
        //  Content-Type 헤더자동설정
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: 'public-read',
        shouldTransform: (req, file, cb) => {
          cb(null, file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/));
        },
        transform: [
          {
            id: 'webp',
            key: (req, file, cb) => {
              const ext = path.extname(file.originalname);
              const basename = path.basename(file.originalname, ext);
              const filename = basename + Date.now() + '.webp';
              cb(null, filename);
            },
            transform: (req, file, cb) => {
              // 파일 확장자 변환
              cb(
                null,
                sharp().webp({
                  quality: req.body.quality ? parseInt(req.body.quality) : 80,
                  lossless: false,
                }),
              );
            },
          },
        ],
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // 각 파일 당 2mb
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
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
          const basename = path.basename(file.originalname, ext);
          const filename = basename + Date.now() + '.webp';
          cb(null, filename);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // 각 파일 당 2mb
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('지원하지 않는 이미지 형식입니다'), false);
        }
      },
    };
  }
};
