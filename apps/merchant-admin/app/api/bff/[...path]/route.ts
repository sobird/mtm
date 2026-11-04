import { proxyToCoreApi } from '@/lib/core-api';

type RouteContext = { params: Promise<{ path: string[] }> };

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const { path } = await context.params;

  return proxyToCoreApi(request, path);
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  const { path } = await context.params;

  return proxyToCoreApi(request, path);
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  const { path } = await context.params;

  return proxyToCoreApi(request, path);
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  const { path } = await context.params;

  return proxyToCoreApi(request, path);
}
