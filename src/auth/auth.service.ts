import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { Users } from '../entities/Users';
import { DataSource, Repository } from 'typeorm';
import { SnsJoinRequestDto } from 'src/users/dto/join.request.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(Users) private usersRepository: Repository<Users>,
  ) {}
  async validateUser(email: string, password: string) {
    // 서비스에서 이메일을 비교하던지 아니면 레포지토리에서 이메일을 비교하던지 둘중 하나.
    const user = await this.usersRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'name',
        'nickname',
        'image',
        'role',
        'password',
        'phone',
      ], // select로 columns만 가져오기.
    });
    // 사용자가 없는 경우
    if (!user) {
      throw new UnauthorizedException('존재하지 않는 이메일입니다.');
    }
    const result = await bcrypt.compare(password, user.password);
    // 비밀번호가 틀린 경우
    if (!result) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
    }
    if (result) {
      // 패스워드를 빼고 나머지에 대한 데이터 가져오기.
      const { password, ...userWithoutpassword } = user;

      return userWithoutpassword;
    }
  }
  async snsUser(snsuser: SnsJoinRequestDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    // db에 연결
    await queryRunner.connect();
    // 트랜잭션을 시작
    await queryRunner.startTransaction();
    try {
      const user = await queryRunner.manager.getRepository(Users).findOne({
        where: { snsId: snsuser.snsId },
        select: [
          'id',
          'name',
          'nickname',
          'image',
          'role',
          'password',
          'phone',
          'snsId',
        ],
      });
      // sns회원이 없을경우 db에 저장
      if (!user) {
        const newUser = queryRunner.manager.getRepository(Users).create({
          snsId: snsuser.snsId,
          name: snsuser.name,
          nickname: snsuser.nickname,
          phone: snsuser.phone,
          image: snsuser.image,
          socialLoginProvider: snsuser.socialLoginProvider,
        });
        const savedUser = await queryRunner.manager.save(Users, newUser);

        // 트랜잭션 커밋
        await queryRunner.commitTransaction();
        return savedUser;
      } else {
        await queryRunner.commitTransaction();
        return user;
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('회원정보를 찾을수 없습니다');
    } finally {
      await queryRunner.release();
    }
  }
}
