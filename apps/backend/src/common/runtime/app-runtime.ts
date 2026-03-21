export type AppRuntime = 'api' | 'worker';

export function getAppRuntime(value = process.env.APP_RUNTIME): AppRuntime {
  return value === 'worker' ? 'worker' : 'api';
}

export function isWorkerRuntime(value = process.env.APP_RUNTIME) {
  return getAppRuntime(value) === 'worker';
}

export function shouldRegisterQueueProcessors(value = process.env.APP_RUNTIME) {
  return isWorkerRuntime(value);
}
