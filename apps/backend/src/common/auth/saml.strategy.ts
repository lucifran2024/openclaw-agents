import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { MultiSamlStrategy, type Profile } from 'passport-saml';
import type { Request } from 'express';
import { SsoService } from '../../modules/iam/sso.service';

@Injectable()
export class SamlStrategy extends PassportStrategy(MultiSamlStrategy, 'saml', true) {
  constructor(
    private readonly ssoService: SsoService,
    private readonly configService: ConfigService,
  ) {
    super({
      passReqToCallback: true,
      getSamlOptions: (req: Request, done) => {
        void (async () => {
          try {
            const identifier = this.ssoService.extractTenantIdentifier(req);
            if (!identifier) {
              throw new Error('Missing tenant identifier for SSO login');
            }

            const { tenant, config } = await this.ssoService.getSsoContextByIdentifier(identifier);
            const backendUrl =
              this.configService.get<string>('BACKEND_URL') || 'http://localhost:3001';

            done(null, {
              path: '/api/v1/sso/callback',
              callbackUrl: `${backendUrl}/api/v1/sso/callback`,
              entryPoint: config.ssoUrl,
              issuer: `omnichannel-${tenant.slug}`,
              idpIssuer: config.entityId,
              cert: config.certificate,
              disableRequestedAuthnContext: true,
              acceptedClockSkewMs: 5000,
            });
          } catch (error) {
            done(error instanceof Error ? error : new Error(String(error)));
          }
        })();
      },
    });
  }

  async validate(req: Request, profile: Profile | null | undefined) {
    return this.ssoService.handleSamlCallback(req, profile);
  }
}
