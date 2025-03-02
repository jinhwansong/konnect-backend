import {
  Controller,
  Get,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UndefinedToNullInterceptor } from 'src/common/interceptors/undefinedToNull.Interceptor';
import { NotificationService } from './notification.service';
import { LoggedInGuard } from 'src/auth/logged-in.guard';
import { User } from 'src/common/decorators/user.decorator';
import { GetNotificationDto } from './dto/notification.response.dto';

@UseInterceptors(UndefinedToNullInterceptor)
@ApiTags('알람')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '사용자 알림 조회' })
  @ApiResponse({
    status: 200,
    description: '알림 조회가 완료됬습니다.',
    type: GetNotificationDto,
  })
  @Get('')
  async findUserNoti(@User() user) {
    return this.notificationService.findUserNoti(user.id);
  }
  @ApiResponse({
    status: 200,
    description: '해당 알림을 읽었습니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '알람 읽음 표시' })
  @Patch('')
  async markAsRead(@User() user, body: number) {
    return this.notificationService.markAsRead(user.id, body);
  }
  @ApiResponse({
    status: 200,
    description: '모든 알림을 읽었습니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '모든알람 읽음 표시' })
  @Patch('')
  async markAllAsRead(@User() user) {
    return this.notificationService.markAllAsRead(user.id);
  }
  @ApiResponse({
    status: 200,
    description: '해당 알림을 삭제했습니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '알림 삭제' })
  @Patch('')
  async remove(@User() user, body: number) {
    return this.notificationService.remove(user.id, body);
  }
  @ApiResponse({
    status: 200,
    description: '모든 알림을 삭제했습니다.',
  })
  @UseGuards(LoggedInGuard)
  @ApiOperation({ summary: '모든알람 읽음 표시' })
  @Patch('')
  async removeAll(@User() user) {
    return this.notificationService.removeAll(user.id);
  }
}
