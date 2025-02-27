import { OmitType } from '@nestjs/swagger';
import { JoinRequestDto } from 'src/users/dto/join.request.dto';

//OmitType 기존 데이터에서 원하는거 뺄때.
export class UserDtoByPassword extends OmitType(JoinRequestDto, ['password']) {}
