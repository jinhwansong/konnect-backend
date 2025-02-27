import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enum/status.enum';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
