import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MentoringController } from './mentoring.controller';
import { MentoringService } from './mentoring.service';
import * as Entities from 'src/entities';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(Object.values(Entities)),
    NotificationModule,
  ],
  controllers: [MentoringController],
  providers: [MentoringService],
})
export class MentoringModule {}
