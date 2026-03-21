import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserEntity } from './user.entity';
import { RoleEntity } from './role.entity';
import { AuditLogEntity } from './audit-log.entity';
import { RefreshTokenEntity } from './refresh-token.entity';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { AuditService } from './audit.service';
import { AuthController } from './auth.controller';
import { UserController } from './user.controller';
import { TenantModule } from '../tenant/tenant.module';
import { ApiKeyEntity } from './api-key.entity';
import { SsoConfigEntity } from './sso-config.entity';
import { ApiKeyService } from './api-key.service';
import { SsoService } from './sso.service';
import { SsoController } from './sso.controller';
import { ApiKeyController } from './api-key.controller';
import { ScimController } from './scim.controller';
import { ApiKeyStrategy } from '../../common/auth/api-key.strategy';
import { ApiKeyAuthGuard } from '../../common/auth/api-key-auth.guard';
import { SamlStrategy } from '../../common/auth/saml.strategy';

@Module({
  imports: [
    TenantModule,
    MikroOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      AuditLogEntity,
      RefreshTokenEntity,
      ApiKeyEntity,
      SsoConfigEntity,
    ]),
  ],
  controllers: [
    AuthController,
    UserController,
    SsoController,
    ApiKeyController,
    ScimController,
  ],
  providers: [
    UserService,
    AuthService,
    AuditService,
    ApiKeyService,
    SsoService,
    ApiKeyStrategy,
    ApiKeyAuthGuard,
    SamlStrategy,
  ],
  exports: [UserService, AuthService, AuditService, ApiKeyService, SsoService],
})
export class IamModule {}
