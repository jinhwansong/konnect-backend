import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
// 응답을 보냇는데 한번더 조작햇으면 좋겟다 라고 생각할때
// 인터셉터를 쓴다고 함. 마지막 가공 찬스
//implements 타입을 정확하게 지킬수 잇음.
@Injectable()
export class UndefinedToNullInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    // 응답을 보내기 전
    return next
      .handle()
      .pipe(map((data) => (data === undefined ? null : data)));
  }
}
