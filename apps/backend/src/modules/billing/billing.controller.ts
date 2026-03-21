import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RbacGuard } from '../../common/auth/rbac.guard';
import { RequirePermission } from '../../common/auth/rbac.decorator';
import { CurrentTenant } from '../../common/auth/tenant.decorator';
import { BillingService } from './billing.service';
import { PlanService } from './plan.service';
import { StripeService } from './stripe.service';

@ApiTags('Billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly planService: PlanService,
    private readonly stripeService: StripeService,
  ) {}

  @Get('subscription')
  @RequirePermission('billing:read')
  @ApiOperation({ summary: 'Get current subscription details' })
  async getSubscription(@CurrentTenant() tenantId: string) {
    return this.billingService.getSubscription(tenantId);
  }

  @Get('usage')
  @RequirePermission('billing:read')
  @ApiOperation({ summary: 'Get usage summary for current period' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getUsage(
    @CurrentTenant() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const period = from && to ? { from, to } : undefined;
    return this.billingService.getUsageSummary(tenantId, period);
  }

  @Get('quota/:metric')
  @RequirePermission('billing:read')
  @ApiOperation({ summary: 'Check quota for a specific metric' })
  async checkQuota(
    @CurrentTenant() tenantId: string,
    @Param('metric') metric: string,
  ) {
    return this.billingService.checkQuota(tenantId, metric);
  }

  @Get('plans')
  @RequirePermission('billing:read')
  @ApiOperation({ summary: 'List available plans' })
  async getPlans() {
    return this.planService.getPlans();
  }

  @Post('checkout')
  @RequirePermission('billing:write')
  @ApiOperation({ summary: 'Create a Stripe checkout session for a plan upgrade' })
  async createCheckout(
    @CurrentTenant() tenantId: string,
    @Body('planId') planId: string,
  ) {
    return this.stripeService.createCheckoutSession(tenantId, planId);
  }

  @Post('portal')
  @RequirePermission('billing:write')
  @ApiOperation({ summary: 'Create a Stripe billing portal session' })
  async createPortal(@CurrentTenant() tenantId: string) {
    return this.stripeService.createPortalSession(tenantId);
  }

  @Post('cancel')
  @RequirePermission('billing:write')
  @ApiOperation({ summary: 'Cancel current subscription at period end' })
  async cancel(@CurrentTenant() tenantId: string) {
    return this.stripeService.cancelSubscription(tenantId);
  }

  @Get('invoices')
  @RequirePermission('billing:read')
  @ApiOperation({ summary: 'List Stripe invoices for current tenant' })
  async getInvoices(@CurrentTenant() tenantId: string) {
    return this.stripeService.listInvoices(tenantId);
  }
}
