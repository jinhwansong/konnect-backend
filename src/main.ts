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

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  if (process.env.NODE_ENV === 'production') {
    app.enableCors({
      origin: 'http://localhost:3000',
      credentials: true,
    });
  } else {
    app.enableCors({
      origin: 'http://localhost:3000',
      credentials: true,
    });
  }
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
        ttl: 60 * 60 * 1, // 1시간
        disableTouch: true,
        rolling: true,
        enableOfflineQueue: false,
      }),
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 60,
        domain: 'localhost',
        path: '/',
        sameSite: 'lax',
      },
    }),
  );
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(passport.session());
  // 업로드 폴더 생성
  createUploadFolder();
  // 이미지 정적 파일
  app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });
  // 예외처리
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 필수
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
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
