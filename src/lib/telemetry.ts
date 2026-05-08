import { trace, context, SpanStatusCode, type Span } from "@opentelemetry/api";

const TRACER_NAME = "plane-sse";

export function getTracer() {
  return trace.getTracer(TRACER_NAME, "1.0.0");
}

export function startSpan(name: string, attributes?: Record<string, string | number | boolean>) {
  const tracer = getTracer();
  const span = tracer.startSpan(name, { attributes });
  return span;
}

export function endSpanOk(span: Span) {
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
}

export function endSpanError(span: Span, message: string) {
  span.setStatus({ code: SpanStatusCode.ERROR, message });
  span.end();
}

export { context, SpanStatusCode };
