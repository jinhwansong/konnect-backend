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
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMember)
    private readonly chatMenberRepository: Repository<ChatMember>,
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    @InjectRepository(Reservations)
    private reservationsRepository: Repository<Reservations>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
    private chatGateway: ChatGateway,
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
        where: { id: body.reservationId, status: MemtoringStatus.PROGRESS },
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
        where: { reservationId: body.reservationId, isActive: true },
        relations: ['chatmember'],
      });
      if (exChatRoom) {
        const isMenber = exChatRoom.chatmember.some(
          (member) => member.user.id === userId,
        );
        if (isMenber) {
          return exChatRoom;
        }
      }
      const date = new Date();
      const title = `${date.getDate} ${reservations.programs.title} 멘토링 방`;
      // 채팅방 생성
      const chatRoom = queryRunner.manager.create(ChatRoom, {
        isActive: true,
        reservationId: body.reservationId,
        name: title,
      });
      const savedChatRoom = await queryRunner.manager.save(chatRoom);
      // 멘토 멤버 생성
      const mentorMember = queryRunner.manager.create(ChatMember, {
        role: UserRole.MENTOR,
        isActive: true,
        chatRoomId: savedChatRoom.id.toString(),
        userId: mentor,
      });
      // 멘토 멤버 생성
      const menteeMember = queryRunner.manager.create(ChatMember, {
        role: UserRole.MENTEE,
        isActive: true,
        chatRoomId: savedChatRoom.id.toString(),
        userId: mentee,
      });
      await queryRunner.manager.save([mentorMember, menteeMember]);
      await queryRunner.commitTransaction();
      return { message: '채팅방이 생성되었습니다.', id: savedChatRoom.id };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  // 새 채팅방 입장
  async getRoom(userId: number, reservationId: number) {
    const reservations = await this.reservationsRepository.findOne({
      where: { id: reservationId, status: MemtoringStatus.PROGRESS },
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
    // 채팅방 조회
    const chatRoom = await this.chatRoomRepository.findOne({
      where: { reservationId, isActive: true },
      relations: ['chatmember', 'chatmember.user'],
    });
    if (!chatRoom) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    }
    const data = chatRoom.chatmember.map((item) => ({
      id: item.user.id,
      name: item.user.name,
      role: item.role,
      image: item.user.image,
    }));
    return { message: '채팅방이 생성되었습니다.', data };
  }
  // 메시지 전송
  async sendMessage(
    userId: number,
    roomId: string,
    content: string,
    type: string = 'TEXT',
    fileInfo?: any,
  ) {
    // 접근 권한 확인
    const member = await this.chatMenberRepository.findOne({
      where: { chatRoomId: roomId, userId, isActive: true },
    });
    if (!member) {
      throw new ForbiddenException('채팅방 접근 권한이 없습니다.');
    }
    // 메시지 저장
    const message: any = {
      chatRoomId: roomId,
      senderId: userId,
      content,
      senderName: member.user.name,
      type,
      createdAt: new Date(),
    };
    // 파일 업로드시
    if (fileInfo && type !== 'text') {
      message.fileUrl = fileInfo.url;
      message.fileName = fileInfo.filename;
      message.fileSize = fileInfo.size;
    }
    // 몽고디비에 저장
    const newMessage = new this.messageModel(message);
    const savedMessage = await newMessage.save();
    // 레디스에 업데이트
    await this.redisService.saveChatMassage(roomId, {
      _id: savedMessage._id,
      senderId: userId,
      senderName: member.user.name,
      content,
      type,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      createdAt: savedMessage.createdAt,
    });
    this.chatGateway.sendMessageToRoom(roomId, {
      _id: savedMessage._id.toString(),
      senderId: userId,
      senderName: member.user.name,
      content,
      type,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      createdAt: savedMessage.createdAt,
    });
    return savedMessage;
  }
  // 메시지 조회
  async getMessage(
    userId: number,
    roomId: string,
    options: { limit?: number; before?: string } = {},
  ) {
    // 채팅방 접근 권한 확인
    const member = await this.chatMenberRepository.findOne({
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
