import { faker } from '@faker-js/faker';
import { Users } from '../../entities/Users';
import { setSeederFactory } from 'typeorm-extension';
import bcrypt from 'bcrypt';
import { SocialLoginProvider, UserRole } from '../../common/enum/status.enum';

export default setSeederFactory(Users, async () => {
  const user = new Users();
  const uniqueId = faker.string.alphanumeric(8);
  user.email = `${uniqueId}@naver.com`;
  user.password = await bcrypt.hash('admin123!#', 12);
  user.nickname = faker.internet.userName().substring(0, 10);
  user.name = faker.person.firstName(); // 수정된 부분
  user.phone = `010${faker.string.numeric(8)}`;
  user.role = UserRole.USER;
  user.socialLoginProvider = SocialLoginProvider.LOCAL;
  user.image = `https://picsum.photos/200/200?random=${uniqueId}`;
  return user;
});
