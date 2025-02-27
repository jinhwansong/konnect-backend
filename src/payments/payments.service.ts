import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PaymentVerificationDto } from 'src/reservation/dto/create-reservation.dto';
import { catchError, EMPTY, firstValueFrom, of, retry } from 'rxjs';
import { PaginationDto } from 'src/common/dto/page.dto';
import { Payments, PaymentStatus } from 'src/entities/Payments';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MemtoringStatus, Reservations } from 'src/entities/Reservations';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Payments)
    private readonly paymentRepository: Repository<Payments>,
    @InjectRepository(Reservations)
    private readonly reservationRepository: Repository<Reservations>,
    private readonly dataSource: DataSource,
  ) {}
  // 결제 승인 요청
  async comfirmPayment(body: PaymentVerificationDto) {
    try {
      const response = await firstValueFrom(
        await this.httpService
          .post(
            'https://api.tosspayments.com/v1/payments/confirm',
            {
              orderId: body.orderId,
              amount: body.price,
              paymentKey: body.paymentKey,
            },
            {
              headers: {
                Authorization: `Basic ${Buffer.from(
                  `${process.env.TOSS_SECRET}:`,
                ).toString('base64')}`,
                'Content-Type': 'application/json',
              },
            },
          )
          .pipe(
            retry({
              count: 1,
              delay: (error) => {
                // ALREADY_PROCESSED_PAYMENT 에러인 경우 재시도하지 않음
                if (error.response?.data.code === 'ALREADY_PROCESSED_PAYMENT') {
                  return EMPTY;
                }
                return of(1000); // 다른 에러의 경우 1초 후 재시도
              },
            }),
            catchError(async (error) => {
              // 이미 처리된 경우에는?
              if (error.response?.data.code === 'ALREADY_PROCESSED_PAYMENT') {
                return Promise.resolve({
                  data: {
                    status: 'DONE',
                    totalAmount: error.response.data.totalAmount,
                    receiptUrl: error.response.data.receipt.url,
                  },
                });
              }
              throw error;
            }),
          ),
      );
      return {
        status: 'DONE',
        totalAmount: response.data.totalAmount,
        receiptUrl: response.data.receipt.url,
      };
    } catch (error) {
      if (error.response?.data?.code === 'PROVIDER_ERROR') {
        return {
          status: 'PENDING',
          message: '결제 처리 중입니다',
          shouldRetry: true,
        };
      }
      throw new BadRequestException('결제 확인에 실패했습니다');
    }
  }
  // 구매내역
  async get(id: number, { limit = 10, page = 1 }: PaginationDto) {
    try {
      const payment = await this.paymentRepository
        .createQueryBuilder('payment')
        .where('payment.userId = :userId', { userId: id })
        .andWhere('payment.status != :status', {
          status: PaymentStatus.PENDING,
        })
        .leftJoinAndSelect('payment.reservation', 'reservation')
        .orderBy('payment.createdAt', 'DESC')
        .select([
          'payment.price',
          'payment.title',
          'payment.paymentKey',
          'payment.paidAt',
          'payment.orderId',
          'payment.receiptUrl',
          'payment.id',
          'payment.status',
          'payment.createdAt',
        ])
        .skip((page - 1) * limit)
        .take(limit);
      const [results, total] = await payment.getManyAndCount();
      const items = results.map((result) => ({
        id: result.id,
        title: result.title,
        price: result.price,
        status: result.status,
        orderId: result.orderId,
        paymentKey: result.paymentKey,
        paidAt: result.paidAt,
        receiptUrl: result.receiptUrl,
      }));
      return {
        items,
        totalPage: Math.ceil(total / limit),
        message: '결제 목록 조회 완료 되었습니다.',
      };
    } catch (error) {
      throw new BadRequestException('결제 목록 조회 중 오류가 발생했습니다.');
    }
  }
  // 구매 취소
  async getCancel(id: number, paymentKey: string) {
    try {
      const result = await this.dataSource.transaction(async (manager) => {
        const payment = await this.paymentRepository.findOne({
          where: { paymentKey, userId: id },
          relations: ['reservation'],
        });
        if (!payment) {
          throw new BadRequestException(
            '결제 정보를 찾을 수 없거나 권한이 없습니다.',
          );
        }
        if (payment.reservation.status === MemtoringStatus.COMPLETED) {
          throw new BadRequestException('이미 진행된 멘토링 입니다.');
        }
        const response = await firstValueFrom(
          this.httpService.post(
            `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
            {
              cancelReason: '구매자가 취소를 원함',
            },
            {
              headers: {
                Authorization: `Basic ${Buffer.from(
                  `${process.env.TOSS_SECRET}:`,
                ).toString('base64')}`,
                'Content-Type': 'application/json',
              },
            },
          ),
        );
        if (response.data?.status === 'CANCELED') {
          payment.status = PaymentStatus.REFUNDED;
          await manager.save(payment);
          if (payment.reservation) {
            payment.reservation.status = MemtoringStatus.CANCELLED;
            await manager.save(Reservations, payment.reservation);
          }
          return {
            message: '환불 및 예약이 취소되었습니다',
            status: PaymentStatus.REFUNDED,
          };
        }
      });
      return result;
    } catch (error) {
      throw new BadRequestException('환불 처리 중 오류가 발생했습니다.');
    }
  }
}
