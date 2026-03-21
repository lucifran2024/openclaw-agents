import { registerAs } from '@nestjs/config';
import { getDatabaseConnectionConfig } from './connection-url.util';

export default registerAs('database', () => getDatabaseConnectionConfig());
