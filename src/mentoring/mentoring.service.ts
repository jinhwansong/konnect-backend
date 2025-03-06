import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/common/dto/page.dto';
import { SearchDto } from 'src/common/dto/search.dto';
import { AvailableSchedule } from 'src/entities/AvailableSchedule';
import { Contact } from 'src/entities/Contact';
import { MentoringPrograms } from 'src/entities/MentoringPrograms';
import { MentorProfile } from 'src/entities/MentorProfile';
import { NotificationType } from 'src/entities/Notification';
import { MemtoringStatus, Reservations } from 'src/entities/Reservations';
import { MentoingProgramCreateDto } from 'src/mentoring/dto/program.request.dto';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { NotificationService } from 'src/notification/notification.service';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class MentoringService {
  constructor(
    @InjectRepository(MentorProfile)
    private readonly mentorProfileRepository: Repository<MentorProfile>,
    @InjectRepository(MentoringPrograms)
    private readonly programsRepository: Repository<MentoringPrograms>,
    @InjectRepository(AvailableSchedule)
    private readonly scheduleRepository: Repository<AvailableSchedule>,
    @InjectRepository(Reservations)
    private readonly reservationRepository: Repository<Reservations>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
    private readonly dataSource: DataSource,
  ) {}
  // 멘토링 프로그램 등록
  async create(body: MentoingProgramCreateDto, id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 프로필 조회
      const profile = await this.mentorProfileRepository.findOne({
        where: { userId: id },
        relations: ['user'],
      });
      if (!profile) {
        throw new BadRequestException('멘토 정보를 찾을 수 없습니다.');
      }
      const { available_schedule, ...program } = body;
      // 프로그램 생성
      const newProgram = await queryRunner.manager
        .getRepository(MentoringPrograms)
        .create({
          ...program,
          profile,
        });
      // 프로그램 저장
      const saveProgram = await queryRunner.manager
        .getRepository(MentoringPrograms)
        .save(newProgram);
      // 스캐줄 생성
      const newSchedule = await queryRunner.manager
        .getRepository(AvailableSchedule)
        .create({
          available_schedule,
          programs: { id: saveProgram.id },
        });
      await queryRunner.manager
        .getRepository(AvailableSchedule)
        .save(newSchedule);
      await queryRunner.commitTransaction();
      return {
        message: '멘토님의 프로그램이 등록되었습니다.',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) {
        throw error; // 원래 에러를 그대로 던짐
      }
      throw new InternalServerErrorException(
        '멘토님의 프로그램 등록 중 오류가 발생했습니다.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  // 멘토링 프로그램 삭제
  async delete(id: number, programId: number) {
    try {
      // 프로필 조회
      const profile = await this.mentorProfileRepository.findOne({
        where: { userId: id },
        relations: ['user'],
      });
      if (!profile) {
        throw new BadRequestException('멘토 정보를 찾을 수 없습니다.');
      }
      const program = await this.programsRepository.findOne({
        where: { id: programId },
        relations: ['profile'],
      });
      if (!program) {
        throw new BadRequestException('해당 프로그램을 찾을 수 없습니다.');
      }
      if (id !== program.profile.userId) {
        throw new BadRequestException('프로그램을 삭제할 권한이 없습니다.');
      }
      await this.scheduleRepository.delete({ programId });
      await this.programsRepository.delete(programId);
      return { message: '멘토님의 프로그램이 삭제되었습니다.' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        '멘토님의 프로그램 삭제 중 오류가 발생했습니다.',
      );
    }
  }
  // 멘토링 프로그램 조회
  async get(id: number, { page = 1, limit = 10 }: PaginationDto) {
    try {
      // 프로필 조회
      const profile = await this.mentorProfileRepository.findOne({
        where: { userId: id },
        relations: ['user'],
      });
      if (!profile) {
        throw new BadRequestException('멘토 정보를 찾을 수 없습니다.');
      }
      const program = await this.programsRepository
        .createQueryBuilder('program')
        .where('program.profileId = :profileId', { profileId: profile.id })
        .leftJoinAndSelect('program.reviews', 'review')
        .orderBy('program.createdAt', 'DESC')
        .select([
          'program.id',
          'program.title',
          'program.price',
          'program.duration',
          'program.status',
          'program.createdAt',
          'review.rating',
        ])
        .skip((page - 1) * limit)
        .take(limit);
      // 데이터와 전체 개수 조회
      const [results, total] = await program.getManyAndCount();
      const items = results.map((result) => {
        let averageRating = 0;
        if (result.reviews && result.reviews.length > 0) {
          const sum = result.reviews.reduce(
            (acc, rev) => acc + Number(rev.rating),
            0,
          );
          averageRating = sum / result.reviews.length;
        }
        return {
          id: result.id,
          title: result.title,
          price: result.price,
          duration: result.duration,
          status: result.status,
          createdAt: result.createdAt,
          averageRating,
          totalReviews: result.reviews ? result.reviews.length : 0,
        };
      });
      return {
        items,
        totalPage: Math.ceil(total / limit),
        message: '멘토님의 프로그램 목록을 조회했습니다.',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        '멘토님의 프로그램 조회 중 오류가 발생했습니다.',
      );
    }
  }
  // 멘토링 프로그램 상세 조회
  async detail(id: number, programId: number) {
    // 프로필 조회
    const profile = await this.mentorProfileRepository.findOne({
      where: { userId: id },
      relations: ['user'],
    });
    if (!profile) {
      throw new BadRequestException('멘토 정보를 찾을 수 없습니다.');
    }
    const program = await this.programsRepository.findOne({
      where: { id: programId },
      relations: ['profile', 'available'],
    });
    if (!program) {
      throw new BadRequestException('해당 프로그램을 찾을 수 없습니다.');
    }
    // 시간표
    const filterSchedule = Object.entries(program.available.available_schedule)
      .filter(([_, times]) => times.length > 0)
      .reduce((acc, [day, time]) => ({ ...acc, [day]: time }), {});
    let averageRating = 0;
    if (program.reviews && program.reviews.length > 0) {
      const sum = program.reviews.reduce(
        (acc, rev) => acc + Number(rev.rating),
        0,
      );
      averageRating = sum / program.reviews.length;
    }
    return {
      id: program.id,
      title: program.title,
      content: program.content,
      duration: program.duration,
      price: program.price,
      status: program.status,
      createdAt: program.createdAt,
      mentoring_field: program.mentoring_field,
      averageRating,
      totalReviews: program.reviews ? program.reviews.length : 0,
      available_schedule: filterSchedule,
    };
  }
  // 멘토링 프로그램 수정
  async update(body: MentoingProgramCreateDto, id: number, programId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 프로필 프로그램 스케줄 조회
      const program = await queryRunner.manager
        .getRepository(MentoringPrograms)
        .createQueryBuilder('program')
        .leftJoinAndSelect('program.profile', 'profile')
        .leftJoinAndSelect('program.available', 'available')
        .where('program.id = :programId', { programId })
        .getOne();
      if (!program.profile) {
        throw new BadRequestException('멘토 정보를 찾을 수 없습니다.');
      }
      if (!program) {
        throw new BadRequestException('해당 프로그램을 찾을 수 없습니다.');
      }
      if (id !== program.profile.userId) {
        throw new BadRequestException('프로그램을 수정할 권한이 없습니다.');
      }
      // 프로그램 정보 및 스케줄 정보 분리
      const { available_schedule, ...programData } = body;
      // 프로그램 정보 수정
      await queryRunner.manager
        .getRepository(MentoringPrograms)
        .save({ id: programId, ...programData });
      // 스케줄 정보 수정
      await queryRunner.manager
        .getRepository(AvailableSchedule)
        .save({ id: program.available.id, available_schedule });
      await queryRunner.commitTransaction();
      return { message: '멘토님의 프로그램이 수정되었습니다.' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) {
        throw error; // 원래 에러를 그대로 던짐
      }
      throw new InternalServerErrorException(
        '멘토님의 프로그램 수정 중 오류가 발생했습니다.',
      );
    } finally {
      await queryRunner.release();
    }
  }
  // 멘토링 프로그램 검색
  async search(
    id: number,
    { page = 1, limit = 10, keyword, sort = 'latest' }: SearchDto,
  ) {
    // 프로필 조회
    const profile = await this.mentorProfileRepository.findOne({
      where: { userId: id },
      relations: ['user'],
    });
    if (!profile) {
      throw new BadRequestException('멘토 정보를 찾을 수 없습니다.');
    }
    // 멘토의 모든 프로그램을 꺼냄
    const program = await this.programsRepository
      .createQueryBuilder('program')
      .where('program.profileId = :profileId', { profileId: profile.id })
      .leftJoinAndSelect('program.reviews', 'review')
      .select([
        'program.id',
        'program.title',
        'program.price',
        'program.duration',
        'program.status',
        'program.createdAt',
        'review.rating',
      ]);
    if (keyword) {
      program.andWhere(
        '(program.title LIKE :keyword OR program.content LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (sort) {
      switch (sort) {
        case 'latest':
          program.orderBy('program.createdAt', 'DESC');
        case 'price':
          program.orderBy('program.price', 'ASC');
        default:
          program.orderBy('program.title', 'ASC');
      }
    }
    program.skip((page - 1) * limit).take(limit);
    // 데이터와 전체 개수 조회
    const [results, total] = await program.getManyAndCount();
    const items = results.map((result) => {
      let averageRating = 0;
      if (result.reviews && result.reviews.length > 0) {
        const sum = result.reviews.reduce(
          (acc, rev) => acc + Number(rev.rating),
          0,
        );
        averageRating = sum / result.reviews.length;
      }
      return {
        id: result.id,
        title: result.title,
        price: result.price,
        duration: result.duration,
        status: result.status,
        createdAt: result.createdAt,
        averageRating,
        totalReviews: result.reviews ? result.reviews.length : 0,
      };
    });
    return {
      items,
      totalPage: Math.ceil(total / limit),
      message: '멘토님의 프로그램 목록을 조회했습니다.',
    };
  }

  // 멘토링 관리 조회
  async getSchedule(id: number, { page = 1, limit = 10 }: PaginationDto) {
    try {
      // 프로필 조회
      const profile = await this.mentorProfileRepository.findOne({
        where: { userId: id },
        relations: ['user'],
      });
      if (!profile) {
        throw new BadRequestException('멘토 정보를 찾을 수 없습니다.');
      }
      const reservationList = await this.reservationRepository
        .createQueryBuilder('reservation')
        .leftJoinAndSelect('reservation.programs', 'program')
        .leftJoinAndSelect('reservation.contact', 'contact')
        .leftJoinAndSelect('reservation.user', 'user')
        .where('program.profileId = :profileId', { profileId: profile.id })
        .orderBy('reservation.createdAt', 'DESC')
        .select([
          'reservation.createdAt',
          'reservation.id',
          'reservation.startTime',
          'reservation.endTime',
          'reservation.status',
          'contact.phone',
          'contact.email',
          'program.id',
          'program.title',
          'user.id',
          'user.name',
        ])
        .skip((page - 1) * limit)
        .take(limit);
      const [results, total] = await reservationList.getManyAndCount();
      const items = results.map((result) => ({
        id: result.id,
        startTime: result.startTime,
        endTime: result.endTime,
        status: result.status,
        title: result.programs.title,
        phone: result.contact.phone,
        email: result.contact.email,
        name: result.user.name,
      }));
      return {
        items,
        totalPage: Math.ceil(total / limit),
        message: '멘토링 신청 목록 조회 완료 되었습니다.',
      };
    } catch (error) {
      throw new BadRequestException(
        '멘토링 신청 목록을 불러오던 중 오류가 발생했습니다.',
      );
    }
  }
  // 멘토링 프로그램 상세 조회
  async detailSchedule(id: number, reservationId: number) {
    // 프로필 조회
    const profile = await this.mentorProfileRepository.findOne({
      where: { userId: id },
      relations: ['user'],
    });
    if (!profile) {
      throw new BadRequestException('멘토 정보를 찾을 수 없습니다.');
    }
    const reservation = await this.reservationRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.programs', 'program')
      .leftJoinAndSelect('reservation.contact', 'contact')
      .leftJoinAndSelect('reservation.user', 'user')
      .where('reservation.id = :reservationId ', { reservationId })
      .select([
        'reservation.id',
        'reservation.startTime',
        'reservation.endTime',
        'reservation.status',
        'contact.phone',
        'contact.email',
        'contact.message',
        'program.id',
        'program.title',
        'user.id',
        'user.name',
        'user.image',
      ])
      .getOne();
    // 예약 정보가 없는 경우
    if (!reservation) {
      throw new NotFoundException('예약 정보를 찾을 수 없습니다.');
    }

    // 예약에 연결된 프로그램이 없는 경우
    if (!reservation.programs) {
      throw new BadRequestException('예약에 연결된 프로그램 정보가 없습니다.');
    }
    return {
      id: reservation.id,
      title: reservation.programs.title,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      status: reservation.status,
      phone: reservation.contact.phone,
      message: reservation.contact.message,
      email: reservation.contact.email,
      name: reservation.user.name,
      image: reservation.user.image,
    };
  }
  // 멘토링 승인/거절
  async approve(
    id: number,
    reservationId: number,
    approved: boolean,
    reason?: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const reservation = await queryRunner.manager
        .createQueryBuilder(Reservations, 'reservation')
        .leftJoinAndSelect('reservation.programs', 'program')
        .leftJoinAndSelect('program.profile', 'profile')
        .leftJoinAndSelect('reservation.user', 'user')
        .leftJoinAndSelect('reservation.notification', 'notification')
        .where('reservation.id = :reservationId', { reservationId })
        .andWhere('profile.userId = :id', { id })
        .select([
          'reservation.id',
          'reservation.status',
          'program.id',
          'program.title',
          'reservation.id',
          'user.id',
          'profile.id',
          'profile.userId',
        ])
        .getOne();

      if (!reservation) {
        throw new NotFoundException(
          '예약 정보를 찾을 수 없거나 해당 멘토의 예약이 아닙니다.',
        );
      }
      if (reservation.status === MemtoringStatus.PROGRESS) {
        throw new BadRequestException('이미 처리된 예약입니다.');
      }
      if (reservation.status === MemtoringStatus.CANCELLED) {
        throw new BadRequestException('이미 거절된 예약입니다.');
      }
      // 승인상태 업데이트
      await queryRunner.manager.update(
        Reservations,
        { id: reservationId },
        {
          status: approved
            ? MemtoringStatus.PROGRESS
            : MemtoringStatus.CANCELLED,
          reason: approved ? null : reason,
        },
      );
      //알람유형
      const notiType = approved
        ? NotificationType.MENTORING_COMPLETED
        : NotificationType.RESERVATION_REJECTED;
      // 알람 제목
      const notiMessage = approved
        ? `${reservation.programs.title} 멘토링이 승인되었습니다.`
        : `${reservation.programs.title} 멘토링이 거절되었습니다.`;
      // 알람 생성
      const noti = await this.notificationService.create(
        {
          message: notiMessage,
          type: notiType,
          senderId: reservation.programs.profile.userId, // 발신자
          recipientId: reservation.user.id, // 수신자
          reservationId,
          programId: reservation.programs.id,
        },
        queryRunner.manager,
      );
      await queryRunner.commitTransaction();
      // 트랜잭션 완료 후 실시간 알림 전송
      this.notificationGateway.sendNotificationToUser(
        reservation.user.id, // 수신자
        noti,
      );
      return {
        message: approved
          ? '멘토링 승인이 완료되었습니다.'
          : '멘토링 신청이 거절되었습니다.',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) {
        throw error; // 원래 에러를 그대로 던짐
      }
      throw new InternalServerErrorException(
        '프로그램을 승인 처리 중 오류가 발생했습니다.',
      );
    } finally {
      await queryRunner.release();
    }
  }
}
