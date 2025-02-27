import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mentors } from 'src/entities/Mentors';
import { Users } from 'src/entities/Users';

@Module({
  imports: [TypeOrmModule.forFeature([Mentors, Users])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
