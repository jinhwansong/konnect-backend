import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  Repository,
  Not,
  LessThanOrEqual,
  MoreThanOrEqual,
  MoreThan,
} from 'typeorm';
import {
  CreateReservationDto,
  PaymentVerificationDto,
} from './dto/create-reservation.dto';
import { MemtoringStatus, Reservations } from 'src/entities/Reservations';
import { MentoringPrograms } from 'src/entities/MentoringPrograms';
import { weeklyScheduleDto } from 'src/common/dto/time.dto';
import { Payments, PaymentStatus } from 'src/entities/Payments';
import { PaymentsService } from 'src/payments/payments.service';
import { PaginationDto } from 'src/common/dto/page.dto';
import { NotificationType } from 'src/entities/Notification';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotiEvent } from 'src/common/event/noti.event';
import { Contact } from 'src/entities/Contact';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservations)
    private readonly reservationRepository: Repository<Reservations>,
    @InjectRepository(MentoringPrograms)
    private readonly programsRepository: Repository<MentoringPrograms>,
    @InjectRepository(Payments)
    private readonly paymentsRepository: Repository<Payments>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    private readonly tossPaymentService: PaymentsService,
    private eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}
  // 프로그램 예약
  async create(body: CreateReservationDto, id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 만료된 예약 시간 삭제
      const expired = await this.reservationRepository
        .createQueryBuilder('reservation')
        .select('reservation.id')
        .where('reservation.status = :status', {
          status: MemtoringStatus.PENDING,
        })
        .andWhere('reservation.expire < :now', {
          now: new Date(),
        })
        .getMany();
      // 해당되는 id 가져오기
      const expriedId = expired.map((r) => r.id);
      if (expriedId.length > 0) {
        // contact 삭제
        await this.contactRepository
          .createQueryBuilder()
          .delete()
          .where('reservationId IN (:...expriedId)', { expriedId })
          .execute();
        // contact 삭제
        await this.paymentsRepository
          .createQueryBuilder()
          .delete()
          .where('reservationId IN (:...expriedId)', { expriedId })
          .execute();
        // reservation 삭제
        await this.reservationRepository
          .createQueryBuilder()
          .delete()
          .where('id IN (:...expriedId)', { expriedId })
          .execute();
      }
      // 프로그램 유무 스케줄 정보 조회
      const program = await queryRunner.manager
        .createQueryBuilder(MentoringPrograms, 'program')
        .leftJoinAndSelect('program.available', 'schedule')
        .leftJoinAndSelect('program.profile', 'profile')
        .leftJoinAndSelect('program.reservation', 'reservation')
        .leftJoinAndSelect('profile.user', 'user')
        .where('program.id = :programId', { programId: body.programsId })
        .getOne();
      if (!program) {
        throw new BadRequestException('해당 프로그램이 존재하지 않습니다.');
      }
      if (!program.available) {
        throw new BadRequestException('스케줄 정보를 찾을 수 없습니다.');
      }

      // 멘토 가능시간?
      const availableTime = this.checkTime(
        program.available.available_schedule,
        body.startTime,
        body.endTime,
      );

      if (!availableTime) {
        throw new BadRequestException('선택한 시간에는 예약이 불가능합니다.');
      }
      // 예약 되있어?
      const exReservation = await queryRunner.manager.findOne(Reservations, {
        where: [
          {
            programsId: body.programsId,
            endTime: MoreThanOrEqual(body.startTime),
            startTime: LessThanOrEqual(body.endTime),
            status: Not(MemtoringStatus.CANCELLED),
            expire: MoreThan(new Date()),
          },
        ],
      });
      if (exReservation) {
        throw new BadRequestException('이미 예약된 시간입니다.');
      }

      // 예약 및 연락처 저장
      const reservation = queryRunner.manager.create(Reservations, {
        startTime: body.startTime,
        endTime: body.endTime,
        programsId: body.programsId,
        status: MemtoringStatus.PENDING,
        userId: id,
        scheduleId: program.available.id,
        contact: {
          email: body.email,
          phone: body.phone,
          message: body.message,
        },
        // 3분 만료시간
        expire: new Date(Date.now() + 1 * 60 * 1000),
      });
      await queryRunner.manager.save(reservation);
      // 결제 정보
      const orderId = `MENTOR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const payment = queryRunner.manager.create(Payments, {
        orderId,
        status: PaymentStatus.PENDING,
        price: program.price,
        title: program.title,
        reservationId: reservation.id,
        userId: id,
      });
      // 알림생성
      this.eventEmitter.emit(
        'reservation.created',
        new NotiEvent(
          program.profile.user.id,
          `새로운 멘토링 신청이 있습니다: ${program.title}`,
          NotificationType.RESERVATION_REQUESTED,
          reservation.id,
          program.id,
        ),
      );
      await queryRunner.manager.save(payment);
      await queryRunner.commitTransaction();
      return {
        message: '예약이 완료되었습니다.',
        amount: program.price,
        orderId,
        orderName: program.title,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  private checkTime(
    schedule: weeklyScheduleDto,
    startTime: Date,
    endTime: Date,
  ): boolean {
    // 시작시간의 요일 숫자로 가져옴
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const datOfWeek = startDate.getDay();
    // 요일 문자열
    const days = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];

    // schedule[days[0 ... ]] 이런식으로 요일별 가능시간대 가져옴
    const daySchedule = schedule[days[datOfWeek]];
    // 분으로 변환
    const start = startDate.getUTCHours() * 60 + startDate.getUTCMinutes();
    const end = endDate.getUTCHours() * 60 + endDate.getUTCMinutes();
    // 시간대 검사
    return daySchedule.some((slot) => {
      const [slotStartHour, slotStartMin] = slot.startTime
        .split(':')
        .map(Number);
      const [slotEndHour, slotEndMin] = slot.endTime.split(':').map(Number);
      const slotStart = slotStartHour * 60 + slotStartMin;
      const slotEnd = slotEndHour * 60 + slotEndMin;
      return start >= slotStart && end <= slotEnd;
    });
  }
  // 결제 검증
  async verifyPayment(body: PaymentVerificationDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 결제 정보 조회
      const payment = await queryRunner.manager
        .createQueryBuilder(Payments, 'payment')
        .leftJoinAndSelect('payment.reservation', 'reservation')
        .leftJoinAndSelect('reservation.programs', 'programs')
        .leftJoinAndSelect('programs.profile', 'profile')
        .leftJoinAndSelect('profile.user', 'user')
        .where('payment.orderId = :orderId', { orderId: body.orderId })
        .getOne();
      if (!payment) {
        throw new BadRequestException('결제 정보를 찾을 수 없습니다.');
      }
      // 금액 검증
      if (payment.price !== body.price) {
        throw new BadRequestException('결제 금액이 일치 하지 않습니다.');
      }
      // 토스 결제 승인 요청
      const paymentResult = await this.tossPaymentService.comfirmPayment(body);
      if (paymentResult.totalAmount !== body.price) {
        throw new BadRequestException('결제 금액 검증 실패');
      }
      // 결제 상태 검증
      if (paymentResult.status !== 'DONE') {
        throw new BadRequestException('결제가 정상적으로 완료되지 않았습니다');
      }
      // 정보 업데이트
      payment.paymentKey = body.paymentKey;
      payment.status = PaymentStatus.COMPLETED;
      payment.paidAt = new Date();
      payment.receiptUrl = paymentResult.receiptUrl;
      await queryRunner.manager.save(payment);
      // 예약 상태 업데이트
      await queryRunner.manager.update(
        Reservations,
        { id: payment.reservationId },
        { status: MemtoringStatus.COMFIRMED },
      );
      await queryRunner.commitTransaction();
      return {
        message: '결제 완료 되었습니다.',
        status: 'done',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) {
        throw error; // 원래 에러를 그대로 던짐
      }
      throw new InternalServerErrorException(
        '결제 진행 중 오류가 발생했습니다.',
      );
    } finally {
      await queryRunner.release();
    }
  }
  // 멘토링 신청 내역 리스트
  async getMentoringList(id: number, { limit = 10, page = 1 }: PaginationDto) {
    try {
      const reservationList = await this.reservationRepository
        .createQueryBuilder('reservation')
        .where('reservation.userId = :userId', { userId: id })
        .andWhere('reservation.status != :status', {
          status: MemtoringStatus.PENDING,
        })
        .leftJoinAndSelect('reservation.programs', 'programs')
        .leftJoinAndSelect('programs.profile', 'profile')
        .leftJoinAndSelect('profile.user', 'user')
        .orderBy('reservation.createdAt', 'DESC')
        .select([
          'reservation.createdAt',
          'reservation.id',
          'reservation.startTime',
          'reservation.status',
          'programs.title',
          'programs.duration',
          'programs.id',
          'profile.id',
          'user.name',
        ])
        .skip((page - 1) * limit)
        .take(limit);
      const [results, total] = await reservationList.getManyAndCount();
      const items = results.map((result) => ({
        id: result.id,
        title: result.programs.title,
        duration: result.programs.duration,
        status: result.status,
        mentor: result.programs.profile.user.name,
        startTime: result.startTime,
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
}
