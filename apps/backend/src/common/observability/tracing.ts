import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

let sdk: NodeSDK | null = null;

export function startTracing() {
  if (sdk) {
    return;
  }

  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!otlpEndpoint) {
    return;
  }

  sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME || 'omnichannel-backend',
    traceExporter: new OTLPTraceExporter({
      url: otlpEndpoint.endsWith('/v1/traces')
        ? otlpEndpoint
        : `${otlpEndpoint.replace(/\/$/, '')}/v1/traces`,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  void sdk.start();

  const shutdown = async () => {
    if (!sdk) return;
    await sdk.shutdown().catch(() => undefined);
    sdk = null;
  };

  process.once('SIGTERM', () => {
    void shutdown();
  });

  process.once('SIGINT', () => {
    void shutdown();
  });
}
