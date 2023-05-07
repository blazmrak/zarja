import {
  applyDecorators,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import * as jwt from 'jsonwebtoken'
import {
  ApiBearerAuth,
  ApiExtension,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

type AuthGuardOpts = {
  secret: string
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private opts: AuthGuardOpts) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const [type, token] = request.headers.authorization?.split(' ') ?? [undefined, undefined]

    if (type === 'Bearer') {
      try {
        request['user'] = jwt.verify(token, this.opts.secret)
      } catch {}
    }

    return true
  }
}

export function Protected(...roles: string[]) {
  const ext = roles?.map(r => r.toUpperCase())?.join(', ') || 'ALL'
  return applyDecorators(
    UseGuards(new RolesGuard(roles)),
    ApiBearerAuth(),
    ApiExtension('x-roles', ext),
    ApiForbiddenResponse({ description: 'Insufficient privileges' }),
    ApiUnauthorizedResponse({ description: 'Missing or invalid token' }),
  )
}

export const Token = createParamDecorator(
  (data = { required: true }, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest()
    const user = request['user']

    if (!user && data.required) {
      throw new UnauthorizedException()
    }

    return user
  },
)

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly roles: string[]) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const roles = <string[] | undefined>request?.user?.roles

    if (!roles) {
      throw new UnauthorizedException()
    }

    if (this.roles.length === 0) {
      return true
    }

    return this.roles.some(r => roles.some(u => u === r))
  }
}
