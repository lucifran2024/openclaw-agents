import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RbacGuard } from '../../common/auth/rbac.guard';
import { RequirePermission } from '../../common/auth/rbac.decorator';
import { CurrentTenant } from '../../common/auth/tenant.decorator';
import { SchedulingService } from './scheduling.service';
import { AvailabilityService } from './availability.service';
import { AppointmentService, AppointmentFilters } from './appointment.service';
import { WaitlistService } from './waitlist.service';
import { CreateServiceTypeDto } from './dto/create-service-type.dto';
import { CreateResourceDto } from './dto/create-resource.dto';
import { CreateScheduleRuleDto } from './dto/create-schedule-rule.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { AppointmentStatus } from './entities/appointment.entity';
import { WaitlistStatus } from './entities/waitlist.entity';

@ApiTags('Scheduling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RbacGuard)
@Controller('scheduling')
export class SchedulingController {
  constructor(
    private readonly schedulingService: SchedulingService,
    private readonly availabilityService: AvailabilityService,
    private readonly appointmentService: AppointmentService,
    private readonly waitlistService: WaitlistService,
  ) {}

  // ── Service Types ──────────────────────────────────────────────

  @Get('service-types')
  @RequirePermission('scheduling:read')
  @ApiOperation({ summary: 'List all service types' })
  async listServiceTypes(@CurrentTenant() tenantId: string) {
    return this.schedulingService.findAllServiceTypes(tenantId);
  }

  @Post('service-types')
  @RequirePermission('scheduling:write')
  @ApiOperation({ summary: 'Create a service type' })
  async createServiceType(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateServiceTypeDto,
  ) {
    return this.schedulingService.createServiceType(tenantId, dto);
  }

  @Patch('service-types/:id')
  @RequirePermission('scheduling:write')
  @ApiOperation({ summary: 'Update a service type' })
  async updateServiceType(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateServiceTypeDto>,
  ) {
    const result = await this.schedulingService.updateServiceType(tenantId, id, dto);
    if (!result) throw new NotFoundException('Service type not found');
    return result;
  }

  @Delete('service-types/:id')
  @RequirePermission('scheduling:delete')
  @ApiOperation({ summary: 'Deactivate a service type' })
  async deleteServiceType(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const deleted = await this.schedulingService.deleteServiceType(tenantId, id);
    if (!deleted) throw new NotFoundException('Service type not found');
    return { success: true };
  }

  // ── Resources ──────────────────────────────────────────────────

  @Get('resources')
  @RequirePermission('scheduling:read')
  @ApiOperation({ summary: 'List all resources' })
  async listResources(@CurrentTenant() tenantId: string) {
    return this.schedulingService.findAllResources(tenantId);
  }

  @Post('resources')
  @RequirePermission('scheduling:write')
  @ApiOperation({ summary: 'Create a resource' })
  async createResource(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateResourceDto,
  ) {
    return this.schedulingService.createResource(tenantId, dto);
  }

  @Patch('resources/:id')
  @RequirePermission('scheduling:write')
  @ApiOperation({ summary: 'Update a resource' })
  async updateResource(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateResourceDto>,
  ) {
    const result = await this.schedulingService.updateResource(tenantId, id, dto);
    if (!result) throw new NotFoundException('Resource not found');
    return result;
  }

  @Delete('resources/:id')
  @RequirePermission('scheduling:delete')
  @ApiOperation({ summary: 'Deactivate a resource' })
  async deleteResource(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const deleted = await this.schedulingService.deleteResource(tenantId, id);
    if (!deleted) throw new NotFoundException('Resource not found');
    return { success: true };
  }

  // ── Schedule Rules ─────────────────────────────────────────────

  @Get('rules')
  @RequirePermission('scheduling:read')
  @ApiOperation({ summary: 'List schedule rules for a resource' })
  @ApiQuery({ name: 'resourceId', required: true })
  async listRules(
    @CurrentTenant() tenantId: string,
    @Query('resourceId') resourceId: string,
  ) {
    return this.schedulingService.getScheduleRules(tenantId, resourceId);
  }

  @Post('rules')
  @RequirePermission('scheduling:write')
  @ApiOperation({ summary: 'Create a schedule rule' })
  async createRule(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateScheduleRuleDto,
  ) {
    return this.schedulingService.createScheduleRule(tenantId, dto);
  }

  @Patch('rules/:id')
  @RequirePermission('scheduling:write')
  @ApiOperation({ summary: 'Update a schedule rule' })
  async updateRule(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateScheduleRuleDto>,
  ) {
    const result = await this.schedulingService.updateScheduleRule(tenantId, id, dto);
    if (!result) throw new NotFoundException('Schedule rule not found');
    return result;
  }

  @Delete('rules/:id')
  @RequirePermission('scheduling:delete')
  @ApiOperation({ summary: 'Deactivate a schedule rule' })
  async deleteRule(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const deleted = await this.schedulingService.deleteScheduleRule(tenantId, id);
    if (!deleted) throw new NotFoundException('Schedule rule not found');
    return { success: true };
  }

  // ── Availability ───────────────────────────────────────────────

  @Get('availability')
  @RequirePermission('scheduling:read')
  @ApiOperation({ summary: 'Get available time slots' })
  @ApiQuery({ name: 'resourceId', required: false })
  @ApiQuery({ name: 'serviceTypeId', required: true })
  @ApiQuery({ name: 'date', required: true })
  @ApiQuery({ name: 'unitId', required: false })
  async getAvailability(
    @CurrentTenant() tenantId: string,
    @Query() query: AvailabilityQueryDto,
  ) {
    const rawSlots = await this.availabilityService.getAvailableSlots(tenantId, query);
    return {
      slots: rawSlots.map((s) => ({
        startAt: s.start,
        endAt: s.end,
        available: true,
        resourceId: s.resourceId,
        resourceName: s.resourceName,
      })),
    };
  }

  // ── Appointments ───────────────────────────────────────────────

  @Get('appointments')
  @RequirePermission('scheduling:read')
  @ApiOperation({ summary: 'List appointments with filters' })
  @ApiQuery({ name: 'resourceId', required: false })
  @ApiQuery({ name: 'contactId', required: false })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listAppointments(
    @CurrentTenant() tenantId: string,
    @Query('resourceId') resourceId?: string,
    @Query('contactId') contactId?: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: AppointmentFilters = {
      resourceId,
      contactId,
      date,
      status: status as AppointmentStatus,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    };
    return this.appointmentService.getAppointments(tenantId, filters);
  }

  @Get('appointments/:id')
  @RequirePermission('scheduling:read')
  @ApiOperation({ summary: 'Get appointment by ID' })
  async getAppointment(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const appointment = await this.appointmentService.getAppointmentById(tenantId, id);
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  @Post('appointments')
  @RequirePermission('scheduling:write')
  @ApiOperation({ summary: 'Book a new appointment' })
  async bookAppointment(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentService.bookAppointment(tenantId, dto);
  }

  @Patch('appointments/:id')
  @RequirePermission('scheduling:write')
  @ApiOperation({ summary: 'Reschedule an appointment' })
  async rescheduleAppointment(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('startAt') startAt: string,
  ) {
    return this.appointmentService.rescheduleAppointment(tenantId, id, startAt);
  }

  @Post('appointments/:id/cancel')
  @RequirePermission('scheduling:write')
  @ApiOperation({ summary: 'Cancel an appointment' })
  async cancelAppointment(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.appointmentService.cancelAppointment(tenantId, id, reason);
  }

  @Post('appointments/:id/confirm')
  @RequirePermission('scheduling:write')
  @ApiOperation({ summary: 'Confirm an appointment' })
  async confirmAppointment(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.appointmentService.confirmAppointment(tenantId, id);
  }

  @Post('appointments/:id/no-show')
  @RequirePermission('scheduling:write')
  @ApiOperation({ summary: 'Mark appointment as no-show' })
  async markNoShow(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.appointmentService.markNoShow(tenantId, id);
  }

  @Post('appointments/:id/complete')
  @RequirePermission('scheduling:write')
  @ApiOperation({ summary: 'Mark appointment as completed' })
  async completeAppointment(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.appointmentService.completeAppointment(tenantId, id);
  }

  // ── Waitlist ───────────────────────────────────────────────────

  @Get('waitlist')
  @RequirePermission('scheduling:read')
  @ApiOperation({ summary: 'List waitlist entries' })
  @ApiQuery({ name: 'serviceTypeId', required: false })
  @ApiQuery({ name: 'resourceId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listWaitlist(
    @CurrentTenant() tenantId: string,
    @Query('serviceTypeId') serviceTypeId?: string,
    @Query('resourceId') resourceId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.waitlistService.getWaitlist(tenantId, {
      serviceTypeId,
      resourceId,
      status: status as WaitlistStatus,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('waitlist')
  @RequirePermission('scheduling:write')
  @ApiOperation({ summary: 'Add to waitlist' })
  async addToWaitlist(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateWaitlistDto,
  ) {
    return this.waitlistService.addToWaitlist(tenantId, dto);
  }

  @Delete('waitlist/:id')
  @RequirePermission('scheduling:delete')
  @ApiOperation({ summary: 'Remove from waitlist' })
  async removeFromWaitlist(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const removed = await this.waitlistService.removeFromWaitlist(tenantId, id);
    if (!removed) throw new NotFoundException('Waitlist entry not found');
    return { success: true };
  }
}
