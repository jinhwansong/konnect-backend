import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from './middlewares/logger.middelware';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { ReservationModule } from './reservation/reservation.module';
import { UsersModule } from './users/users.module';
import { MentorModule } from './mento/mentor.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { RedisModule } from './redis/redis.module';
import { ProgramsModule } from './programs/programs.module';
import { PaymentsModule } from './payments/payments.module';
import { MentoringModule } from './mentoring/mentoring.module';
import * as Entities from './entities';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    // dotenv 전역사용
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      // 직접 만들고 db에 만들때 처음에 만들때만 true로
      synchronize: false,
      // 연결유지
      keepConnectionAlive: true,
      logging: process.env.NODE_ENV === 'production' ? false : true,
      poolSize: 20,
      // 마이그레이션
      migrations: [join(__dirname, './migrations/**/*{.ts,.js}')],
      migrationsRun: process.env.NODE_ENV === 'production' ? false : true,
      migrationsTableName: 'migrations',
      // 이모티콘을 사용하기 위해 쓰는거
      charset: 'utf8mb4_general_ci',
      autoLoadEntities: true,
      extra: {
        connectionLimit: 10, // 동시 연결 수 제한
        connectTimeout: 60000, // 연결 시도 제한 시간 (ms)
        enableKeepAlive: true, // TCP Keep-Alive 활성화
        keepAliveInitialDelay: 30000, // Keep-Alive 초기 지연 시간 (ms)
      },
    }),
    TypeOrmModule.forFeature(Object.values(Entities)),
    AdminModule,
    ReservationModule,
    UsersModule,
    MentorModule,
    AuthModule,
    RedisModule,
    ProgramsModule,
    PaymentsModule,
    MentoringModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  constructor(private dataSource: DataSource) {}
  async onModuleInit() {
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }

      // 연결 상태 모니터링
      setInterval(async () => {
        try {
          if (!this.dataSource.isInitialized) {
            await this.dataSource.initialize();
            console.log('Database reconnected successfully');
          }

          // 연결 테스트를 위한 간단한 쿼리 실행
          await this.dataSource.query('SELECT 1');
        } catch (error) {
          console.error('Database connection error:', error);
          // 연결이 끊어진 경우 재연결 시도
          if (this.dataSource.isInitialized) {
            await this.dataSource.destroy();
          }
          await this.dataSource.initialize();
        }
      }, 5000); // 5초마다 체크
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
    }
  }
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
