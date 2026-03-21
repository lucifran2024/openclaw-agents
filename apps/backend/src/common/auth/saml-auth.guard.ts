import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SamlAuthGuard extends AuthGuard('saml') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const tenant =
      request.query?.tenant ||
      request.body?.RelayState ||
      request.query?.RelayState;

    if (!tenant) {
      return undefined;
    }

    return {
      additionalParams: {
        RelayState: tenant,
      },
    };
  }
}
