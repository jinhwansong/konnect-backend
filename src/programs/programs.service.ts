import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MentoringPrograms } from 'src/entities/MentoringPrograms';
import { MemtoringStatus, Reservations } from 'src/entities/Reservations';
import { Between, Not, Repository } from 'typeorm';
import { ProgramRequestDto } from './dto/program.request';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(MentoringPrograms)
    private readonly mentorProgramRepository: Repository<MentoringPrograms>,
    @InjectRepository(Reservations)
    private readonly reservationRepository: Repository<Reservations>,
  ) {}
  // 프로그램 가져오기
  async get({
    page = 1,
    limit = 10,
    sort = 'latest',
    mentoring_field,
  }: ProgramRequestDto) {
    try {
      const program = await this.mentorProgramRepository
        .createQueryBuilder('program')
        .leftJoinAndSelect('program.profile', 'profile')
        .leftJoinAndSelect('profile.user', 'user')
        .leftJoinAndSelect('user.mentor', 'mentor')
        .leftJoinAndSelect('program.reviews', 'review')
        .select([
          'program.id',
          'program.title',
          'program.mentoring_field',
          'program.createdAt',
          'review.rating',
          'user.name',
          'profile.company',
          'profile.position',
          'profile.image',
          'mentor.career',
        ]);

      // 멘토링 분야 필터링
      if (mentoring_field && mentoring_field !== 'all') {
        program.andWhere('program.mentoring_field = :mentoring_field', {
          mentoring_field,
        });
      }
      // 정렬
      if (sort) {
        switch (sort) {
          case 'latest':
            program.orderBy('program.createdAt', 'DESC');
            break;
          default:
            program.orderBy('program.title', 'ASC');
            break;
        }
      }
      // 데이터와 전체 개수 조회
      const [results, total] = await program
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();
      if (total === 0) {
        return {
          items: [],
          totalPage: 0,
          message: '검색 결과가 없습니다',
        };
      }
      const items = results.map((item) => {
        let averageRating = 0;
        if (item.reviews && item.reviews.length > 0) {
          const sum = item.reviews.reduce(
            (acc, rev) => acc + Number(rev.rating),
            0,
          );
          averageRating = sum / item.reviews.length;
        }
        return {
          id: item.id,
          title: item.title,
          mentoring_field: item.mentoring_field,
          averageRating,
          company: item.profile.company || '',
          position: item.profile.position || '',
          image: item.profile.image || '',
          career: item.profile.user.mentor.career || '',
          name: item.profile.user.name || '',
          totalReviews: item.reviews.length > 0 ? item.reviews.length : 0,
        };
      });
      return {
        items,
        totalPage: Math.ceil(total / limit),
        message: '프로그램 목록을 불러왔습니다.',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        '프로그램 목록을 불러오는 중 오류가 발생했습니다.',
      );
    }
  }
  async getDetail(id: number) {
    try {
      const program = await this.mentorProgramRepository.findOne({
        where: { id },
        relations: [
          'profile',
          'available',
          'profile.user.mentor',
          'profile.user',
        ],
      });
      if (!program) {
        throw new BadRequestException('해당 프로그램이 존재 하지 않습니다.');
      }
      return {
        id: program.id,
        title: program.title,
        mentoring_field: program.mentoring_field,
        content: program.content,
        price: program.price,
        duration: program.duration,
        company: program.profile.company,
        position: program.profile.position,
        image: program.profile.image,
        name: program.profile.user.name,
        career: program.profile.user.mentor.career,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        '프로그램 목록을 불러오는 중 오류가 발생했습니다.',
      );
    }
  }

  async getAvailableDates(programId: number, year: number, month: number) {
    try {
      const program = await this.mentorProgramRepository
        .createQueryBuilder('program')
        .leftJoinAndSelect('program.available', 'schedule')
        .where('program.id = :programId', { programId })
        .getOne();
      if (!program?.available) {
        throw new BadRequestException('스케줄 정보를 가져올 수 없습니다.');
      }
      // 중복제거
      const availableDates = new Set();
      // 이번달과 다음달 가능한 날은?
      for (let monthOffset = 0; monthOffset < 2; monthOffset++) {
        let targetYear = Number(year);
        let targetMonth = Number(month) + monthOffset;
        if (targetMonth > 12) {
          targetMonth -= 12;
          targetYear += 1;
        }
        // 이달의 일자수 구하기
        const monthOfDate = new Date(targetYear, targetMonth, 0).getDate();
        for (let day = 1; day <= monthOfDate; day++) {
          // 오늘 날짜
          const currentDate = new Date(targetYear, targetMonth - 1, day);
          // 오늘 날짜 요일
          const currentWeek = currentDate.getDay();
          // 오늘은 될까....?
          const scheduled =
            program.available.available_schedule[
              [
                'sunday',
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday',
                'saturday',
              ][currentWeek]
            ];
          // 오늘이 된다면... 현재 날짜를 넣는다.
          if (scheduled && scheduled.length > 0) {
            const date = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            availableDates.add(date);
          }
        }
      }
      return Array.from(availableDates);
    } catch (error) {
      throw new InternalServerErrorException(
        '가능한 날짜 조회 중 오류가 발생했습니다.',
      );
    }
  }
  // 가능한 날짜 시간 조회
  async getTimeSlots(
    programId: number,
    year: number,
    month: number,
    day: number,
  ) {
    try {
      const program = await this.mentorProgramRepository
        .createQueryBuilder('program')
        .leftJoinAndSelect('program.available', 'schedule')
        .leftJoinAndSelect('program.profile', 'profile')
        .leftJoinAndSelect('profile.user', 'user')
        .where('program.id = :programId', { programId })
        .getOne();
      if (!program?.available) {
        throw new BadRequestException('스케줄 정보를 가져올 수 없습니다.');
      }
      // 특정날짜 설정
      const targetDate = new Date(year, month - 1, day);
      // 해당요일의 가능시간
      const dayOfWeek = targetDate.getDay();
      const daySchedule =
        program.available.available_schedule[
          [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
          ][dayOfWeek]
        ];
      const reservations = await this.reservationRepository.find({
        where: {
          programsId: programId,
          startTime: Between(
            // 00 00 00 부터
            new Date(year, month - 1, day, 0, 0, 0),
            // 23 59 59 까지
            new Date(year, month - 1, day, 23, 59, 59),
          ),
          status: Not(MemtoringStatus.CANCELLED),
        },
      });
      return {
        title: program.title,
        name: program.profile.user.name,
        price: program.price,
        duration: program.duration,
        availableSlots: daySchedule,
        reservedTimes: reservations.map((r) => ({
          startTime: r.startTime,
          endTime: r.endTime,
        })),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        '시간대 조회 중 오류가 발생했습니다.',
      );
    }
  }
}
