import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UndefinedToNullInterceptor } from 'src/common/interceptors/undefinedToNull.Interceptor';
import { ChatService } from './chat.service';
import { ChatRoom } from 'src/entities/ChatRoom';
import { CreateRoomDTO, SendMessageDto } from './dto/chat.request.dto';
import { User } from 'src/common/decorators/user.decorator';
import { LoggedInGuard } from 'src/auth/logged-in.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { getFileUrl, multerFile } from 'src/common/utils/file.options';

@UseInterceptors(UndefinedToNullInterceptor)
@ApiTags('채팅')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @ApiResponse({
    status: 201,
    description: '채팅방 생성 성공',
    type: ChatRoom,
  })
  @ApiOperation({ summary: '1:1 채팅방 생성' })
  @Post('')
  @UseGuards(LoggedInGuard)
  createRoom(@User() user, @Body() body: CreateRoomDTO) {
    return this.chatService.createRoom(user.id, body);
  }
  @ApiResponse({
    status: 201,
    description: '채팅방 입장 성공',
    type: ChatRoom,
  })
  @ApiOperation({ summary: '1:1 채팅방 입장' })
  @Get(':roomId')
  @UseGuards(LoggedInGuard)
  getRoom(@User() user, @Param('id', ParseIntPipe) id: number) {
    return this.chatService.getRoom(user.id, id);
  }
  @ApiResponse({
    status: 201,
    description: '메시지 전송 성공',
  })
  @ApiOperation({ summary: '메시지 전송' })
  @Post(':roomId/message')
  @UseGuards(LoggedInGuard)
  @UseInterceptors(FileInterceptor('file', multerFile()))
  sendMessage(
    @User() user,
    @Param('roomId') roomId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: SendMessageDto,
  ) {
    const fileUrl = getFileUrl(file);

    const fileInfo = {
      url: fileUrl,
      name: file.originalname,
      size: file.size,
    };

    const fileType = file.mimetype.startsWith('image/') ? 'image' : 'file';
    return this.chatService.sendMessage(
      user.id,
      roomId,
      body.content,
      fileType,
      fileInfo,
    );
  }
  @ApiResponse({
    status: 200,
    description: '메시지 조회 성공',
  })
  @ApiOperation({ summary: '메시지 조회' })
  @ApiQuery({ name: 'limit', required: false, description: '조회할 메시지 수' })
  @ApiQuery({ name: 'before', required: false, description: '기준 메시지 id' })
  @Get(':roomId/message')
  @UseGuards(LoggedInGuard)
  getMessage(
    @User() user,
    @Param('roomId') roomId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    return this.chatService.getMessage(user.id, roomId, {
      limit: limit ? Number(limit) : 50,
      before,
    });
  }
}
