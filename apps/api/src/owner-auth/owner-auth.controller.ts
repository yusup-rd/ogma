import { Controller, Get, Post, Req, Res } from "@nestjs/common";
import type { CookieOptions, Request, Response } from "express";
import {
  assertSameOrigin,
  PublicRoute,
  readAuthCookie,
} from "./owner-auth.guard";
import { OwnerAuthService } from "./owner-auth.service";

@Controller("auth")
export class OwnerAuthController {
  constructor(private readonly auth: OwnerAuthService) {}

  private get cookies(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.auth.secure,
      sameSite: "lax",
      path: "/",
    };
  }

  @Get("session")
  @PublicRoute(true)
  async session(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader("Cache-Control", "private, no-store");
    const ownerId = await this.auth.findOwnerId(
      readAuthCookie(request, this.auth.sessionCookie),
    );
    return { signedIn: Boolean(ownerId), available: this.auth.available };
  }

  @Post("sign-in")
  @PublicRoute(true)
  async signIn(@Req() request: Request, @Res() response: Response) {
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("Referrer-Policy", "no-referrer");
    assertSameOrigin(request, this.auth.origin);
    try {
      const attempt = await this.auth.startSignIn();
      response.cookie(this.auth.attemptCookie, attempt.token, {
        ...this.cookies,
        expires: attempt.expiresAt,
      });
      response.redirect(303, attempt.authorizationUrl.href);
    } catch {
      response.redirect(303, "/?signIn=unavailable");
    }
  }

  @Get("callback")
  @PublicRoute(true)
  async callback(@Req() request: Request, @Res() response: Response) {
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.clearCookie(this.auth.attemptCookie, this.cookies);
    const token = readAuthCookie(request, this.auth.attemptCookie);
    const queryIndex = request.originalUrl.indexOf("?");
    if (!token || queryIndex === -1) {
      response.redirect(303, "/?signIn=failed");
      return;
    }
    try {
      const session = await this.auth.completeSignIn(
        token,
        request.originalUrl.slice(queryIndex),
      );
      response.cookie(this.auth.sessionCookie, session.token, {
        ...this.cookies,
        expires: session.expiresAt,
      });
      response.redirect(303, "/");
    } catch {
      response.redirect(303, "/?signIn=failed");
    }
  }

  @Post("sign-out")
  @PublicRoute(true)
  async signOut(@Req() request: Request, @Res() response: Response) {
    response.setHeader("Cache-Control", "private, no-store");
    assertSameOrigin(request, this.auth.origin);
    await this.auth.revokeSession(
      readAuthCookie(request, this.auth.sessionCookie),
    );
    response.clearCookie(this.auth.sessionCookie, this.cookies);
    response.redirect(303, "/");
  }
}
