import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MentoringPrograms } from './MentoringPrograms';
import { weeklyScheduleDto } from '../common/dto/time.dto';
import { Reservations } from './Reservations';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

@Entity({ schema: 'konnect', name: 'availableschedule' })
export class AvailableSchedule {
  // 키값
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;
  // 멘토링 가능날짜
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => weeklyScheduleDto)
  @ApiProperty({
    example: {
      monday: [
        { startTime: '09:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '18:00' },
      ],
      tuesday: [],
      wednesday: [{ startTime: '13:00', endTime: '17:00' }],
      thursday: [],
      friday: [{ startTime: '10:00', endTime: '15:00' }],
      saturday: [],
      sunday: [],
    },
    description: '요일별 멘토링 가능 시간',
    required: true,
    type: () => weeklyScheduleDto,
  })
  @Column('json')
  available_schedule: weeklyScheduleDto;

  @Column()
  programId: number;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;

  // 프로그램과 관계설정
  @OneToOne(() => MentoringPrograms, (program) => program.available)
  @JoinColumn({ name: 'programId' })
  programs: MentoringPrograms;
  // 예약 관계설정
  @OneToMany(() => Reservations, (reservation) => reservation.schedule)
  reservation: Reservations[];
}
