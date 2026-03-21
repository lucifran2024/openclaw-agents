import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  tid: string;
  email: string;
  role: string;
  permissions: string[];
  teams: string[];
  units: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') || 'changeme',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.tid) {
      throw new UnauthorizedException('Invalid token claims');
    }
    return {
      sub: payload.sub,
      userId: payload.sub,
      tid: payload.tid,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions || [],
      teams: payload.teams || [],
      units: payload.units || [],
    };
  }
}
