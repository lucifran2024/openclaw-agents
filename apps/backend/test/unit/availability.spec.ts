import { AvailabilityService } from '../../src/modules/scheduling/availability.service';
import { AppointmentStatus } from '../../src/modules/scheduling/entities/appointment.entity';
import { ScheduleExceptionType } from '../../src/modules/scheduling/entities/schedule-exception.entity';

describe('AvailabilityService', () => {
  const em = {
    findOneOrFail: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  let service: AvailabilityService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AvailabilityService(em as any);
  });

  it('calculates available slots from working rules and existing appointments', async () => {
    em.findOneOrFail.mockResolvedValue({ durationMinutes: 60 });
    em.find.mockImplementation(async (entity: { name?: string }, where: Record<string, unknown>) => {
      if (entity.name === 'ResourceEntity') {
        return [
          {
            id: 'resource_1',
            name: 'Dr. Exemplo',
            isActive: true,
            serviceTypeIds: ['service_1'],
          },
        ];
      }

      if (entity.name === 'ScheduleRuleEntity') {
        return [
          {
            startTime: '09:00',
            endTime: '12:00',
            dayOfWeek: 5,
            isActive: true,
          },
        ];
      }

      if (entity.name === 'ScheduleExceptionEntity') {
        return [
          {
            type: ScheduleExceptionType.BLOCKED,
            startTime: '10:00',
            endTime: '11:00',
          },
        ];
      }

      if (entity.name === 'AppointmentEntity') {
        expect(where.status.$in).toContain(AppointmentStatus.SCHEDULED);
        return [];
      }

      return [];
    });

    const slots = await service.getAvailableSlots('tenant_1', {
      serviceTypeId: 'service_1',
      date: '2026-03-20',
    });

    expect(slots).toEqual([
      expect.objectContaining({
        start: '2026-03-20T09:00:00',
        end: '2026-03-20T10:00:00',
      }),
      expect.objectContaining({
        start: '2026-03-20T11:00:00',
        end: '2026-03-20T12:00:00',
      }),
    ]);
  });

  it('detects overlapping appointments', async () => {
    em.count.mockResolvedValue(1);

    const available = await service.isSlotAvailable(
      'tenant_1',
      'resource_1',
      new Date('2026-03-20T09:00:00.000Z'),
      new Date('2026-03-20T10:00:00.000Z'),
    );

    expect(available).toBe(false);
  });
});
