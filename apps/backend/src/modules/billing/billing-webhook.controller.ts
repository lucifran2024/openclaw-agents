import { Controller, Headers, HttpCode, HttpStatus, Post, RawBody } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth/public.decorator';
import { StripeService } from './stripe.service';

@ApiTags('Billing Webhook')
@Controller('billing')
export class BillingWebhookController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  async handleWebhook(
    @RawBody() rawBody: Buffer | undefined,
    @Headers('stripe-signature') signature?: string,
  ) {
    return this.stripeService.handleWebhook(rawBody || Buffer.from(''), signature);
  }
}
