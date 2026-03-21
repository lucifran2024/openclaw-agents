import { registerAs } from '@nestjs/config';
import { getRedisConnectionConfig } from './connection-url.util';

export default registerAs('redis', () => getRedisConnectionConfig());
