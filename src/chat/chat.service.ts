import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Reservations, Users } from 'src/entities';
import { ChatMember } from 'src/entities/ChatMember';
import { ChatRoom } from 'src/entities/ChatRoom';
import { RedisService } from 'src/redis/redis.service';
import { DataSource, Repository } from 'typeorm';
import { CreateRoomDTO } from './dto/chat.request.dto';
import { MemtoringStatus } from 'src/entities/Reservations';
import { UserRole } from 'src/common/enum/status.enum';
import { InjectModel } from '@nestjs/mongoose';
import { Message, MessageDocument } from 'src/schema/message.schema';
import { Model } from 'mongoose';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMember)
    private readonly chatMemberRepository: Repository<ChatMember>,
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    @InjectRepository(Reservations)
    private reservationsRepository: Repository<Reservations>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
  ) {}

  // 새 채팅방 생성
  async createRoom(userId: number, body: CreateRoomDTO) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const reservations = await this.reservationsRepository.findOne({
        where: { id: body.chatRoomId, status: MemtoringStatus.PROGRESS },
        relations: [
          'user',
          'programs',
          'programs.profile',
          'programs.profile.user',
        ],
      });
      if (!reservations) {
        throw new BadRequestException('예약을 찾을 수 없습니다.');
      }
      // 사용자가 해당 멘티 또는 멘토인지 확인
      const mentor = reservations.programs.profile.user.id;
      const mentee = reservations.user.id;
      if (mentor !== userId && mentee !== userId) {
        throw new ForbiddenException('채팅방 접근 권한이 없습니다.');
      }
      // 예약한 방 존재여부
      const exChatRoom = await this.chatRoomRepository.findOne({
        where: { chatRoomId: body.chatRoomId },
        relations: ['chatmember', 'chatmember.user'],
      });
      if (exChatRoom) {
        const isMenber = exChatRoom.chatmember.some(
          (member) => member.user?.id === userId,
        );
        if (isMenber) {
          return {
            message: '채팅방이 생성되었습니다.',
            chatRoomId: reservations.id,
          };
        }
      }
      // 채팅방 생성
      const chatRoom = queryRunner.manager.create(ChatRoom, {
        chatRoomId: body.chatRoomId,
        name: `${reservations.programs.title} 멘토링 방`,
      });
      const savedChatRoom = await queryRunner.manager.save(chatRoom);
      // 멘토 멤버 생성
      const member = queryRunner.manager.create(ChatMember, {
        role: userId === mentor ? UserRole.MENTOR : UserRole.MENTEE,
        isActive: true,
        chatRoomId: savedChatRoom.id.toString(),
        userId: mentor,
      });
      await queryRunner.manager.save(member);
      await queryRunner.commitTransaction();
      return {
        message: '채팅방이 생성되었습니다.',
        chatRoomId: reservations.id,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  // 새 채팅방 입장
  async getRoom(userId: number, chatRoomId: number) {
    const reservations = await this.reservationsRepository.findOne({
      where: { id: chatRoomId, status: MemtoringStatus.PROGRESS },
      relations: [
        'user',
        'programs',
        'programs.profile',
        'programs.profile.user',
      ],
    });
    if (!reservations) {
      throw new BadRequestException('예약을 찾을 수 없습니다.');
    }
    // 사용자가 해당 멘티 또는 멘토인지 확인
    const mentor = reservations.programs.profile.user.id;
    const mentee = reservations.user.id;
    if (mentor !== userId && mentee !== userId) {
      throw new ForbiddenException('채팅방 접근 권한이 없습니다.');
    }
    // 사용자 역할
    const roles = userId === mentor ? UserRole.MENTOR : UserRole.MENTEE;
    // 채팅방 조회
    let chatRoom = await this.chatRoomRepository.findOne({
      where: { chatRoomId },
      relations: ['chatmember', 'chatmember.user', 'chatmember.room'],
    });
    if (!chatRoom) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    }
    // 현재 입장한 멤버 확인
    const exMember = chatRoom.chatmember.find(
      (member) => member.user.id === userId,
    );
    // 새로 입장한 사용자 추가
    if (!exMember) {
      const member = this.chatMemberRepository.create({
        role: roles,
        isActive: true,
        chatRoomId: chatRoom.id.toString(),
        userId: userId,
      });
      await this.chatMemberRepository.save(member);
      // 다시 조회
      chatRoom = await this.chatRoomRepository.findOne({
        where: { chatRoomId },
        relations: ['chatmember', 'chatmember.user', 'chatmember.room'],
      });
    } else {
      // 이미 들어온 사람은 활성 상태 업데이트
      exMember.isActive = true;
      await this.chatMemberRepository.save(exMember);
    }
    // 입장한 사용자 데이터 필터링
    const mentors = chatRoom.chatmember
      .filter((item) => item.user.id === mentor)
      .map((items) => ({
        id: items.user.id,
        name: items.user.name,
        role: items.role,
        isActive: items.isActive,
        image: items.user.image,
      }));
    const mentees = chatRoom.chatmember
      .filter((item) => item.user.id === mentee)
      .map((items) => ({
        id: items.user.id,
        name: items.user.name,
        role: items.role,
        isActive: items.isActive,
        image: items.user.image,
      }));
    return {
      message: '채팅방이 생성되었습니다.',
      mentors: mentors[0],
      roomInfo: {
        id: chatRoom.id,
        roomTitle: chatRoom.name,
        createRoom: chatRoom.createdAt,
      },
      mentees: mentees,
    };
  }
  // 메시지 조회
  async getMessage(
    userId: number,
    roomId: string,
    options: { limit?: number; before?: string } = {},
  ) {
    // 채팅방 접근 권한 확인
    const member = await this.chatMemberRepository.findOne({
      where: { chatRoomId: roomId, userId, isActive: true },
    });

    if (!member) {
      throw new ForbiddenException('채팅방 접근 권한이 없습니다.');
    }
    // 레디스에서 데이터 가져오기
    let message = [];
    try {
      message = await this.redisService.getChatMessage(
        roomId,
        options.limit || 50,
      );
      // 레디스에 데이터가 없거나 부족할시 몽고디비서 가져옴?
      if (message.length === 0 || message.length < (options.limit || 50)) {
        const data: any = { chatRoomId: roomId };
        if (options.before) {
          const beforeMessage = await this.messageModel.findById(
            options.before,
          );
          if (beforeMessage) {
            data.createdAt = { $1t: beforeMessage.createdAt };
          }
        }
        message = await this.messageModel
          .find(data)
          .sort({ createdAt: -1 })
          .limit(options.limit || 50)
          .exec();
        // 메시지 순서 조정 (최신 순서로)
        return message.reverse();
      }
      return message;
    } catch (error) {
      // 오류시 몽고디비서 가져옴
      const data: any = { chatRoomId: roomId };
      if (options.before) {
        const beforeMessage = await this.messageModel.findById(options.before);
        if (beforeMessage) {
          data.createdAt = { $1t: beforeMessage.createdAt };
        }
      }
      message = await this.messageModel
        .find(data)
        .sort({ createdAt: -1 })
        .limit(options.limit || 50)
        .exec();
      // 메시지 순서 조정 (최신 순서로)
      return message.reverse();
    }
  }
}
