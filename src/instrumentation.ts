export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    // Dynamic imports to avoid edge runtime issues
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");
    const { getNodeAutoInstrumentations } =
      await import("@opentelemetry/auto-instrumentations-node");
    const { resourceFromAttributes } = await import("@opentelemetry/resources");
    const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } =
      await import("@opentelemetry/semantic-conventions");
    const { SimpleSpanProcessor } = await import("@opentelemetry/sdk-trace-node");

    const sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: "plane",
        [ATTR_SERVICE_VERSION]: "1.0.0",
      }),
      spanProcessor: new SimpleSpanProcessor(
        new OTLPTraceExporter({
          url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
        }),
      ),
      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-http": { enabled: true },
          "@opentelemetry/instrumentation-fs": { enabled: false },
        }),
      ],
    });

    sdk.start();
  }
}
