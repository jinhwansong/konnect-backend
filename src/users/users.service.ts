import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { Users } from 'src/entities/Users';
import {
  UpdateNicknameDto,
  UpdatePasswordDto,
  UpdatePhoneDto,
} from './dto/update.requset.dto';
import { JoinRequestDto } from './dto/join.request.dto';

@Injectable()
export class UsersService {
  // 레포지토리 : 테이블(db)와 엔티티를 이어준다.
  constructor(
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    private readonly dataSource: DataSource,
  ) {}
  async findByEmail(phone: string) {
    return await this.userRepository.findOne({
      where: { phone },
      select: ['phone'],
    });
  }
  async Join(body: JoinRequestDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    if (!body.email) {
      throw new BadRequestException('이메일을 작성해주세요.');
    }
    if (!body.password) {
      throw new BadRequestException('비밀번호를 작성해주세요.');
    }
    if (!body.name) {
      throw new BadRequestException('이름을 작성해주세요.');
    }
    if (!body.nickname) {
      throw new BadRequestException('닉네임을 작성해주세요.');
    }
    if (!body.phone) {
      throw new BadRequestException('휴대폰번호를 작성해주세요.');
    }
    // 중복사용자
    const user = await queryRunner.manager.getRepository(Users).findOne({
      where: { email: body.email },
    });
    if (user) {
      throw new UnauthorizedException('이미 존재하는 사용자입니다.');
    }
    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(body.password, 12);
    const { password, ...userJoin } = body;
    try {
      // 회원가입
      await queryRunner.manager.getRepository(Users).save({
        ...userJoin,
        password: hashedPassword,
      });
      await queryRunner.commitTransaction();
      return { message: '회원가입이 완료되었습니다.' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
  async checkEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      throw new BadRequestException('중복된 이메일이 존재합니다.');
    }
    return { message: '사용 가능한 이메일 입니다.' };
  }
  async checkNickname(nickname: string) {
    const user = await this.userRepository.findOne({ where: { nickname } });
    if (user) {
      throw new BadRequestException('중복된 닉네임이 존재합니다.');
    }
    return { message: '사용 가능한 닉네임 입니다.' };
  }

  async updatePhone(body: UpdatePhoneDto, id: number) {
    const user = await this.userRepository.findOne({
      where: { phone: body.phone },
    });
    if (user) {
      throw new BadRequestException('이미 존재하는 휴대폰 번호입니다.');
    }
    await this.userRepository.update(id, { phone: body.phone });
    const updatedUser = await this.userRepository.findOne({
      where: { id },
    });
    return {
      message: '휴대폰번호가 변경되었습니다.',
      phone: updatedUser.phone,
    };
  }

  async updateNickname(body: UpdateNicknameDto, id: number) {
    const user = await this.userRepository.findOne({
      where: { nickname: body.nickname },
    });
    if (user) {
      throw new BadRequestException('이미 존재하는 닉네임입니다.');
    }
    await this.userRepository.update(id, {
      nickname: body.nickname,
    });
    const updatedUser = await this.userRepository.findOne({
      where: { id },
    });
    return {
      message: '닉네임이 변경되었습니다.',
      nickname: updatedUser.nickname,
    };
  }
  async updatePassword(body: UpdatePasswordDto, id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['password'],
    });
    const isPasswordValid = await bcrypt.compare(
      body.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('현재 비밀번호가 일치하지 않습니다.');
    }
    const hashedPassword = await bcrypt.hash(body.newPassword, 12);
    await this.userRepository.update(id, { password: hashedPassword });
    return { message: '비밀번호가 변경되었습니다.' };
  }
  async updateProfile(file: Express.Multer.File, id: number) {
    try {
      if (!file) {
        throw new BadRequestException('업로드된 파일이 없습니다.');
      }
      const imageUrl = `/uploads/${file.filename}`;
      await this.userRepository.update(id, { image: imageUrl });
      return { message: '프로필이미지가 변경되었습니다.', image: imageUrl };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // 원래 에러를 그대로 던짐
      }
      throw new InternalServerErrorException(
        '프로필 이미지 업데이트에 실패했습니다.',
      );
    }
  }
}
