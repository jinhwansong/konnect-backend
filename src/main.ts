import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { HttpExceptionFilter } from './httpException.fliter';
import connectRedis from 'connect-redis';
import { createClient } from 'redis';
import path from 'path';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { createUploadFolder } from './common/utils/upload.utils';
import dotenv from 'dotenv';

declare const module: any;
dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: [process.env.CLIENT],
    credentials: true,
  });
  // 레디스 클라이언트 생성
  let redisClient;
  if (!redisClient) {
    redisClient = createClient({
      url: `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      legacyMode: true,
    });
    // 에러 핸들러
    redisClient.on('error', (err) => {
      console.error(`Error connecting to Redis: ${err}`);
    });
    // 종료처리
    process.on('SIGINT', () => {
      redisClient.quit();
    });
  }

  const RedisStore = connectRedis(session);
  app.use(
    session({
      // 매요청마다 저장 x
      resave: false,
      // 데이터 없는 세션 저장 x
      saveUninitialized: false,
      secret: process.env.COOKIE_SECRET,
      store: new RedisStore({
        client: redisClient,
        prefix: 'session:', // 세션 키에 사용할 접두사
        ttl: 3600, // 1시간
      }),
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000,
        sameSite: 'lax',
        domain: 'www.konee.shop',
      },
    }),
  );
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(passport.session());
  // 업로드 폴더 생성
  createUploadFolder();
  createUploadFolder('uploads/chat-files');
  // 이미지 정적 파일
  const uploadsPath = path.join(__dirname, '..', 'uploads');
  app.useStaticAssets(uploadsPath, { prefix: '/uploads' });
  // 예외처리
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  // 스웨거 설정
  const config = new DocumentBuilder()
    .setTitle('커넥트 api문서')
    .setDescription('커넥트 개발을 위한 api문서')
    .setVersion('1.0')
    // 스웨어에서 로그인 할때
    .addCookieAuth('connect.sid')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  const port = process.env.PORT || 9090;
  await app.listen(port);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
