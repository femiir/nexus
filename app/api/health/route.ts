/**
 * Health Check Endpoint
 *
 * Used by Docker health checks to verify the application is running
 * Similar to Django's health check endpoints
 */

export async function GET() {
  return Response.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'nexus'
    },
    { status: 200 }
  )
}
