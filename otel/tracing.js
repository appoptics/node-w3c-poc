'use strict'

const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api')
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node')
const { Resource } = require('@opentelemetry/resources')
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions')
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base')
const { ZipkinExporter } = require('@opentelemetry/exporter-zipkin')
const { registerInstrumentations } = require('@opentelemetry/instrumentation')
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http')
const { GrpcInstrumentation } = require('@opentelemetry/instrumentation-grpc')

const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'otel-pong'
  })
})

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL)

provider.addSpanProcessor(
  new SimpleSpanProcessor(
    new ZipkinExporter({
      // IMPORTANT : host.docker.internal
      url: 'http://host.docker.internal:9411/api/v2/spans'
    })
  )
)

provider.register()

registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new GrpcInstrumentation()
  ]
})

console.log('tracing initialized')
