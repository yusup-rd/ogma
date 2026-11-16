import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request, Response } from "express";
import { OwnerAuthService } from "./owner-auth.service";

export const PublicRoute = Reflector.createDecorator<boolean>();

export interface OwnerRequest extends Request {
  ownerId?: string;
}

export function readAuthCookie(request: Request, name: string) {
  for (const part of request.headers.cookie?.split(";") ?? []) {
    const [key, value] = part.trim().split("=");
    if (key === name && value && /^[\w-]{43}$/.test(value)) return value;
  }
}

export function assertSameOrigin(request: Request, origin: string) {
  if (request.get("origin") !== origin) throw new ForbiddenException();
}

@Injectable()
export class OwnerAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: OwnerAuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    if (this.reflector.get(PublicRoute, context.getHandler())) return true;
    const request = context.switchToHttp().getRequest<OwnerRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    response.setHeader("Cache-Control", "private, no-store");
    const ownerId = await this.auth.findOwnerId(
      readAuthCookie(request, this.auth.sessionCookie),
    );
    if (!ownerId) throw new UnauthorizedException();
    if (!["GET", "HEAD"].includes(request.method))
      assertSameOrigin(request, this.auth.origin);
    request.ownerId = ownerId;
    return true;
  }
}
