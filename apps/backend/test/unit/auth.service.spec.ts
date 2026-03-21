import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../src/modules/iam/auth.service';

describe('AuthService', () => {
  const userService = {
    validatePassword: jest.fn(),
    getPermissions: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  };

  const tenantService = {
    create: jest.fn(),
  };

  const jwtService = {
    sign: jest.fn(),
  };

  const configService = {
    get: jest.fn(),
  };

  const em = {
    findOne: jest.fn(),
    create: jest.fn(),
    persist: jest.fn(),
    flush: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    userService.getPermissions.mockReturnValue(['team:read']);
    jwtService.sign.mockReturnValue('access-token');
    em.create.mockImplementation((_entity: unknown, data: Record<string, unknown>) => ({
      ...data,
    }));
    service = new AuthService(
      userService as any,
      tenantService as any,
      jwtService as any,
      configService as any,
      em as any,
    );
  });

  it('logs in a user and issues a session', async () => {
    const user = {
      id: 'user_1',
      tenantId: 'tenant_1',
      email: 'owner@example.com',
      name: 'Owner',
      role: 'owner',
      teams: ['team_1'],
      units: [],
    };

    em.findOne.mockResolvedValue(user);
    userService.validatePassword.mockResolvedValue(true);

    const result = await service.login('owner@example.com', 'secret');

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBeDefined();
    expect(result.user).toMatchObject({
      id: 'user_1',
      tenantId: 'tenant_1',
      role: 'owner',
    });
    expect(user.lastLogin).toBeInstanceOf(Date);
    expect(em.persist).toHaveBeenCalled();
  });

  it('rejects invalid credentials', async () => {
    em.findOne.mockResolvedValue({
      id: 'user_1',
      tenantId: 'tenant_1',
      email: 'owner@example.com',
      name: 'Owner',
      role: 'owner',
      teams: [],
      units: [],
    });
    userService.validatePassword.mockResolvedValue(false);

    await expect(service.login('owner@example.com', 'wrong')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('registers a tenant and owner account', async () => {
    tenantService.create.mockResolvedValue({
      id: 'tenant_1',
      name: 'Acme',
      slug: 'acme',
    });
    userService.create.mockResolvedValue({
      id: 'user_1',
      tenantId: 'tenant_1',
      email: 'owner@example.com',
      name: 'Owner',
      role: 'owner',
      teams: [],
      units: [],
    });

    const result = await service.register({
      name: 'Owner',
      email: 'owner@example.com',
      password: 'secret',
      tenantName: 'Acme',
    });

    expect(tenantService.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'acme' }),
    );
    expect(result.tenant).toEqual({
      id: 'tenant_1',
      name: 'Acme',
      slug: 'acme',
    });
    expect(result.user.email).toBe('owner@example.com');
  });

  it('rotates refresh tokens on refresh', async () => {
    const stored = {
      userId: 'user_1',
      tokenHash: 'refresh-token',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    };

    em.findOne.mockResolvedValue(stored);
    userService.findById.mockResolvedValue({
      id: 'user_1',
      tenantId: 'tenant_1',
      email: 'owner@example.com',
      name: 'Owner',
      role: 'owner',
      teams: [],
      units: [],
    });

    const result = await service.refresh('refresh-token');

    expect(stored.revokedAt).toBeInstanceOf(Date);
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBeDefined();
  });
});
