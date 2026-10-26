import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      return false;
    }
    // Agar super-admin (BUNKER_ADMIN) bo'lsa har doim ruxsat beriladi
    if (user.role === 'BUNKER_ADMIN' || user.role === 'bunker_admin') {
      return true;
    }
    return requiredRoles.map((r) => r.toUpperCase()).includes(user.role.toUpperCase());
  }
}
