import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Status } from '../common/enum/status.enum';
import { MentorProfile } from 'src/entities/MentorProfile';
import { Mentors } from 'src/entities/Mentors';
import { DataSource, In, Repository } from 'typeorm';
import {
  UpdateCareerDto,
  UpdateCompanyDto,
  UpdateIntroduceDto,
  UpdatePositionDto,
} from './dto/update.profile.dto';
import { MentorRequestDto } from './dto/mentor.request.dto';

@Injectable()
export class MentorService {
  // 테이블과 엔티티 이어주기.
  constructor(
    @InjectRepository(Mentors)
    private readonly mentorRepository: Repository<Mentors>,
    @InjectRepository(MentorProfile)
    private readonly mentorProfileRepository: Repository<MentorProfile>,
    private readonly dataSource: DataSource,
  ) {}
  // 멘토신청
  async mentorApplication(body: MentorRequestDto, id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    // db 연결
    await queryRunner.connect();
    // 트랜잭션 시작
    await queryRunner.startTransaction();
    if (!body.email) {
      throw new BadRequestException('이메일을 작성해주세요');
    }
    if (!body.job) {
      throw new BadRequestException('희망분야를 선택해주세요');
    }
    if (!body.introduce) {
      throw new BadRequestException('멘토님의 소개를입력해주세요');
    }
    if (!body.portfolio) {
      throw new BadRequestException('포트폴리오 링크를 입력해주세요');
    }
    if (!body.career) {
      throw new BadRequestException('멘토님의 경력을 선택해주세요');
    }
    try {
      // 멘토인지 아닌지 여부
      const Mentor = await queryRunner.manager.getRepository(Mentors).findOne({
        where: {
          userId: id,
          status: In([Status.PENDING, Status.APPROVED]),
        },
        order: { createdAt: 'DESC' },
      });
      if (Mentor) {
        if (Mentor.status === Status.PENDING) {
          throw new BadRequestException('이미 멘토 신청을 하셨습니다');
        }
        if (Mentor.status === Status.APPROVED) {
          throw new BadRequestException('이미 승인된 멘토입니다.');
        }
      }
      // 떨어졋을시 재 신청기간
      const rejected = await queryRunner.manager
        .getRepository(Mentors)
        .findOne({
          where: {
            userId: id,
            status: In([Status.REJECTED]),
          },
          order: { createdAt: 'DESC' },
        });
      // 3일후 신청가능
      if (rejected) {
        const days = 3;
        const canDate = new Date(rejected.updatedAt);
        canDate.setDate(canDate.getDate() + days);
        if (new Date() < canDate) {
          throw new BadRequestException(
            `재신청은 거절 후 ${days}일 이후에 가능합니다. \n` +
              `재신청 가능일은 : ${canDate.toLocaleDateString()}`,
          );
        }
      }
      if (!Mentor) {
        await queryRunner.manager.getRepository(Mentors).save({
          ...body,
          userId: id,
          status: Status.PENDING,
        });
      }
      await queryRunner.commitTransaction();
      return { message: '멘토신청이 완료되었습니다.' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) {
        throw error; // 원래 에러를 그대로 던짐
      }
      throw new InternalServerErrorException(
        '멘토신청 중 오류가 발생했습니다.',
      );
    } finally {
      await queryRunner.release();
    }
  }
  // 멘토 프로필 정보
  async getMentor(id: number) {
    try {
      // 멘토 정보 조회
      const mentor = await this.mentorRepository.findOne({
        where: { user: { id } },
        relations: ['user'],
      });
      if (!mentor) {
        throw new BadRequestException('멘토 정보를 찾을 수 없습니다.');
      }
      // 프로필 조회
      const profile = await this.mentorProfileRepository.findOne({
        where: { user: { id } },
        relations: ['user'],
      });
      return {
        career: mentor.career || '',
        introduce: profile.introduce || '',
        company: profile.company || '',
        image: profile.image || '',
        position: profile.position || '',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        '멘토님의 정보를 찾던 도중 오류가 발생했습니다.',
      );
    }
  }
  // 멘토 회사명 변경
  async updateCompany(body: UpdateCompanyDto, id: number) {
    try {
      // 프로필 조회
      const profile = await this.mentorProfileRepository.findOne({
        where: { userId: id },
        relations: ['user'],
      });
      if (!profile) {
        throw new BadRequestException('멘토 정보를 찾을 수 없습니다.');
      }
      await this.mentorProfileRepository.update(
        { id: profile.id },
        {
          company: body.company,
        },
      );
      const updatedProfile = await this.mentorProfileRepository.findOne({
        where: { userId: id },
        relations: ['user'],
      });
      return {
        message: '멘토님의 회사명이 변경되었습니다.',
        company: updatedProfile.company,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        '멘토님의 회사명을 변경 중 오류가 발생했습니다.',
      );
    }
  }

  // 멘토 자기소개 변경
  async updateIntroduce(body: UpdateIntroduceDto, id: number) {
    try {
      // 프로필 조회
      const profile = await this.mentorProfileRepository.findOne({
        where: { userId: id },
        relations: ['user'],
      });
      if (!profile) {
        throw new BadRequestException('멘토 정보를 찾을 수 없습니다.');
      }
      this.mentorProfileRepository.update(
        { id: profile.id },
        {
          introduce: body.introduce,
        },
      );
      const updatedProfile = await this.mentorProfileRepository.findOne({
        where: { userId: id },
        relations: ['user'],
      });
      return {
        message: '멘토님의 자기소개가 변경되었습니다.',
        introduce: updatedProfile.introduce,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        '자기소개 변경 중 오류가 발생했습니다.',
      );
    }
  }
  // 멘토 이미지 처리
  async uploadImage(files: Array<Express.Multer.File>, id: number) {
    try {
      // 프로필 조회
      const profile = await this.mentorProfileRepository.findOne({
        where: { userId: id },
        relations: ['user'],
      });
      if (!profile) {
        throw new BadRequestException('멘토 정보를 찾을 수 없습니다.');
      }
      const fileUrls = files.map((file) => `/uploads/${file.filename}`);
      return { url: fileUrls };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        '자기소개 이미지 업로드 중 오류가 발생했습니다.',
      );
    }
  }

  // 프로필이미지 변경
  async updateProfile(file: Express.Multer.File, id: number) {
    try {
      if (!file) {
        throw new BadRequestException('업로드된 파일이 없습니다.');
      }
      // 프로필 조회
      const profile = await this.mentorProfileRepository.findOne({
        where: { userId: id },
        relations: ['user'],
      });
      if (!profile) {
        throw new BadRequestException('멘토 정보를 찾을 수 없습니다.');
      }
      const imageUrl = `/uploads/${file.filename}`;

      await this.mentorProfileRepository.update(
        { id: profile.id },
        {
          image: imageUrl,
        },
      );
      const updatedProfile = await this.mentorProfileRepository.findOne({
        where: { userId: id },
        relations: ['user'],
      });
      return {
        message: '프로필이미지가 변경되었습니다.',
        image: updatedProfile.image,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        '파일 업로드 중 오류가 발생했습니다.',
      );
    }
  }
  // 멘토 연차 변경
  async updateCareer(body: UpdateCareerDto, id: number) {
    try {
      const mentor = await this.mentorRepository.findOne({
        where: { user: { id } },
        relations: ['user'],
      });
      if (!mentor) {
        throw new BadRequestException('멘토 정보를 찾을 수 없습니다.');
      }
      await this.mentorRepository.update(
        { id: mentor.id },
        {
          career: body.career,
        },
      );
      const updatedMentor = await this.mentorRepository.findOne({
        where: { user: { id } },
        relations: ['user'],
      });
      return {
        message: '멘토님의 연차가 변경되었습니다.',
        career: updatedMentor.career,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        '멘토님의 연차 변경 중 오류가 발생했습니다.',
      );
    }
  }
  // 전문 분야
  async updatePosition(body: UpdatePositionDto, id: number) {
    try {
      // 프로필 조회
      const profile = await this.mentorProfileRepository.findOne({
        where: { userId: id },
        relations: ['user'],
      });
      if (!profile) {
        throw new BadRequestException('멘토 정보를 찾을 수 없습니다.');
      }
      await this.mentorProfileRepository.update(
        { id: profile.id },
        {
          position: body.position,
        },
      );
      const updatedProfile = await this.mentorProfileRepository.findOne({
        where: { userId: id },
        relations: ['user'],
      });
      return {
        message: '멘토님의 전문분야가 변경되었습니다.',
        company: updatedProfile.position,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        '멘토님의 전문분야를 변경 중 오류가 발생했습니다.',
      );
    }
  }
}
