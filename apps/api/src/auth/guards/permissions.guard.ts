import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator'
import { PermissionKey } from '../permissions'
import { AuthUser } from '../decorators/current-user.decorator'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PermissionKey[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    )

    if (!required || required.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user as AuthUser | undefined

    if (!user) {
      throw new ForbiddenException('Missing authenticated user')
    }

    const hasAll = required.every((permission) =>
      user.permissions.includes(permission)
    )

    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions')
    }

    return true
  }
}
