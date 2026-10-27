import { NextRequest, NextResponse } from 'next/server'
import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/lib/auth/server'

const handlers = toNextJsHandler(auth)
const TOKEN_PATH = '/api/auth/token'

export const GET = (request: NextRequest) => {
  // The JWT plugin's token endpoint is for server-side BFF calls only.
  if (request.nextUrl.pathname.replace(/\/+$/, '') === TOKEN_PATH) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 })
  }
  return handlers.GET(request)
}

export const POST = handlers.POST
export const PATCH = handlers.PATCH
export const PUT = handlers.PUT
export const DELETE = handlers.DELETE
