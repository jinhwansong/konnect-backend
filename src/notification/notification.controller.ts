import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoggedInGuard } from 'src/auth/logged-in.guard';
import { User } from 'src/common/decorators/user.decorator';
import { updateNoti } from './dto/noti.respones.dto';

@ApiTags('알람')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  @ApiResponse({
    status: 200,
    description: 'FCM 토큰이 성공적으로 업데이트되었습니다.',
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 요청입니다.',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: {
          type: 'string',
          example: '인증되지 않은 요청입니다.',
        },
      },
    },
  })
  @UseGuards(new LoggedInGuard())
  @ApiOperation({ summary: 'FCM 토큰 등록/업데이트' })
  @Post('fcm')
  updateFcmToken(@User() user, @Body() body: updateNoti) {
    return this.notificationService.updateFcmToken(user.id, body.fcmToken);
  }
  @ApiResponse({
    status: 200,
    description: 'FCM 토큰이 성공적으로 삭제되었습니다.',
  })
  @UseGuards(new LoggedInGuard())
  @ApiOperation({ summary: 'FCM 토큰 삭제' })
  @Delete('fcm')
  deleteFcmToken(@User() user) {
    return this.notificationService.deleteFcmToken(user.id);
  }
  @ApiResponse({
    status: 200,
    description: '알림 목록이 성공적으로 조회되었습니다.',
  })
  @ApiResponse({
    status: 500,
    description: '알림 목록을 불러오던 중 오류가 발생했습니다.',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: '알림 목록을 불러오던 중 오류가 발생했습니다.',
        },
      },
    },
  })
  @UseGuards(new LoggedInGuard())
  @ApiOperation({ summary: '사용자 알림 목록 조회' })
  @Get('')
  getNotifications(@User() user) {
    return this.notificationService.getNotifications(user.id);
  }
  @ApiResponse({
    status: 200,
    description: '알림이 읽음 처리되었습니다.',
  })
  @UseGuards(new LoggedInGuard())
  @ApiOperation({ summary: '알림 읽음 처리' })
  @Patch(':id')
  markAsRead(@User() user, @Param('id') id: number) {
    return this.notificationService.markAsRead(user.id, id);
  }
  @ApiResponse({
    status: 200,
    description: '알림이 삭제되었습니다.',
  })
  @UseGuards(new LoggedInGuard())
  @ApiOperation({ summary: '알림 삭제' })
  @Delete(':id')
  deleteNoti(@User() user, @Param('id') id: number) {
    return this.notificationService.deleteNoti(user.id, id);
  }
}
