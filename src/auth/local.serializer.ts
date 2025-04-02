import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from '../entities/Users';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';

@Injectable()
export class LocalSerializer extends PassportSerializer {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(Users) private usersRepository: Repository<Users>,
  ) {
    super();
  }

  // 유저의 id만 뽑아서 세션 저장
  serializeUser(user: Users, done: CallableFunction) {
    try {
      done(null, user.id);
    } catch (error) {
      done(error);
    }
  }
  // 세션에서 id를 받아서 사용자 데이터를 꺼내옴
  async deserializeUser(userId: string, done: CallableFunction) {
    try {
      const res = await this.usersRepository.findOne({
        where: { id: +userId },
        select: [
          'id',
          'email',
          'nickname',
          'name',
          'image',
          'role',
          'phone',
          'snsId',
        ],
      });
      done(null, res);
    } catch (error) {
      done(error);
    }
  }
}
