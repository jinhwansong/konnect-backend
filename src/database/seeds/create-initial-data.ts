import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import bcrypt from 'bcrypt';
import { Users } from '../../entities/Users';
import { SocialLoginProvider, UserRole } from '../../common/enum/status.enum';
export default class UserSeeder implements Seeder {
  public async run(
    dataSource: DataSource,
    // 랜덤데이터 만들때 사용
    factoryManager: SeederFactoryManager,
  ): Promise<any> {
    const password = await bcrypt.hash('admin123!#', 12);
    const admin = await dataSource.getRepository(Users);
    await admin.insert([
      {
        email: 'admin@naver.com',
        password: password,
        name: '관리자',
        nickname: '관리자',
        phone: '01012345678',
        role: UserRole.ADMIN,
        socialLoginProvider: SocialLoginProvider.LOCAL,
      },
    ]);
    // 일반사용자 50명
    const userFactory = factoryManager.get(Users);
    await userFactory.saveMany(50);
  }
}
