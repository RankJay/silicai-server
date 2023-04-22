import {
  Injectable,
  UnauthorizedException,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';

@Injectable()
export class JWTGaurd implements CanActivate {
  private isStatus: boolean;
  constructor() {
    this.isStatus = true;
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!context) {
      throw new UnauthorizedException('Cannot authenticate');
    }
    console.log(context);
    return this.isStatus;
  }
}
