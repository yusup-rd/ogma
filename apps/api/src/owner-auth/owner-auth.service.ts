import { createHash, randomBytes } from "node:crypto";
import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as oidc from "openid-client";
import { DatabaseService } from "../database/database.service";

const signInLifetime = 10 * 60 * 1000;
const sessionLifetime = 7 * 24 * 60 * 60 * 1000;
const callbackPath = "/api/auth/callback";
const createToken = () => randomBytes(32).toString("base64url");
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

function secureUrl(value: string) {
  const url = new URL(value);
  const localHttp =
    process.env.NODE_ENV !== "production" &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (!localHttp && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("Ogma authentication URLs require HTTPS.");
  }
  return url;
}

@Injectable()
export class OwnerAuthService {
  readonly origin: string;
  readonly secure: boolean;
  private readonly identity?: {
    issuer: URL;
    issuerId: string;
    clientId: string;
    clientSecret: string;
    subject: string;
    basicAuth: boolean;
  };
  private provider?: Promise<oidc.Configuration>;

  constructor(
    config: ConfigService,
    private readonly database: DatabaseService,
  ) {
    const publicOrigin = config.get<string>("OGMA_PUBLIC_ORIGIN");
    const origin = publicOrigin
      ? secureUrl(publicOrigin)
      : new URL("http://localhost:3000");
    if (origin.pathname !== "/")
      throw new Error("OGMA_PUBLIC_ORIGIN must be an origin without a path.");
    this.origin = origin.origin;
    this.secure = origin.protocol === "https:";

    const issuer = config.get<string>("OIDC_ISSUER");
    const clientId = config.get<string>("OIDC_CLIENT_ID");
    const clientSecret = config.get<string>("OIDC_CLIENT_SECRET");
    const subject = config.get<string>("OIDC_OWNER_SUBJECT");
    const authMethod = config.get<string>("OIDC_TOKEN_AUTH_METHOD");
    if (issuer || clientId || clientSecret || subject || authMethod) {
      if (!publicOrigin || !issuer || !clientId || !clientSecret || !subject)
        throw new Error(
          "Ogma owner sign-in requires a complete OIDC configuration.",
        );
      if (
        authMethod &&
        !["client_secret_post", "client_secret_basic"].includes(authMethod)
      )
        throw new Error(
          "Ogma received an unsupported OIDC token authentication method.",
        );

      const issuerUrl = secureUrl(issuer);
      if (issuerUrl.pathname.includes("/.well-known/"))
        throw new Error("OIDC_ISSUER must be the issuer URL.");
      this.identity = {
        issuer: issuerUrl,
        issuerId: issuer,
        clientId,
        clientSecret,
        subject,
        basicAuth: authMethod === "client_secret_basic",
      };
    }
  }

  get available() {
    return Boolean(this.identity);
  }

  get sessionCookie() {
    return this.secure ? "__Host-ogma-session" : "ogma-session";
  }

  get attemptCookie() {
    return this.secure ? "__Host-ogma-sign-in" : "ogma-sign-in";
  }

  private discover() {
    const identity = this.identity;
    if (!identity)
      throw new ServiceUnavailableException("Owner sign-in is unavailable.");

    this.provider ??= oidc
      .discovery(
        identity.issuer,
        identity.clientId,
        identity.clientSecret,
        identity.basicAuth
          ? oidc.ClientSecretBasic(identity.clientSecret)
          : undefined,
        {
          execute:
            identity.issuer.protocol === "http:"
              ? [oidc.allowInsecureRequests]
              : [],
          timeout: 10,
        },
      )
      .then((provider) => {
        provider.timeout = 10;
        oidc.enableNonRepudiationChecks(provider);
        return provider;
      })
      .catch((error: unknown) => {
        this.provider = undefined;
        throw error;
      });
    return this.provider;
  }

  async startSignIn() {
    const provider = await this.discover();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + signInLifetime);
    const token = createToken();
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const nonce = oidc.randomNonce();
    const state = oidc.randomState();
    const scope =
      provider.serverMetadata().issuer === "https://accounts.google.com"
        ? "openid email"
        : "openid";
    const authorizationUrl = oidc.buildAuthorizationUrl(provider, {
      redirect_uri: new URL(callbackPath, this.origin).href,
      scope,
      code_challenge: await oidc.calculatePKCECodeChallenge(codeVerifier),
      code_challenge_method: "S256",
      state,
      nonce,
    });

    await this.database.$transaction([
      this.database.signInAttempt.deleteMany({
        where: { expiresAt: { lte: now } },
      }),
      this.database.signInAttempt.create({
        data: {
          tokenHash: hashToken(token),
          codeVerifier,
          nonce,
          state,
          expiresAt,
        },
      }),
    ]);
    return { authorizationUrl, token, expiresAt };
  }

  async completeSignIn(token: string, query: string) {
    const identity = this.identity;
    if (!identity) throw new UnauthorizedException();
    const attempt = await this.database.signInAttempt.delete({
      where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() } },
    });

    const provider = await this.discover();
    const callback = new URL(callbackPath, this.origin);
    callback.search = query;
    const tokens = await oidc.authorizationCodeGrant(provider, callback, {
      expectedState: attempt.state,
      expectedNonce: attempt.nonce,
      pkceCodeVerifier: attempt.codeVerifier,
      idTokenExpected: true,
    });
    const claims = tokens.claims();
    const issuer = identity.issuerId;
    if (claims?.iss !== issuer || claims.sub !== identity.subject)
      throw new UnauthorizedException();

    const sessionToken = createToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + sessionLifetime);
    await this.database.$transaction(async (transaction) => {
      const owner = await transaction.owner.upsert({
        where: {
          identityIssuer_identitySubject: {
            identityIssuer: issuer,
            identitySubject: identity.subject,
          },
        },
        create: { identityIssuer: issuer, identitySubject: identity.subject },
        update: {},
        select: { id: true },
      });
      await transaction.ownerSession.deleteMany({
        where: { expiresAt: { lte: now } },
      });
      await transaction.ownerSession.create({
        data: {
          tokenHash: hashToken(sessionToken),
          ownerId: owner.id,
          expiresAt,
        },
      });
    });
    return { token: sessionToken, expiresAt };
  }

  async findOwnerId(token: string | undefined) {
    if (!this.identity || !token) return undefined;
    const session = await this.database.ownerSession.findUnique({
      where: {
        tokenHash: hashToken(token),
        expiresAt: { gt: new Date() },
        owner: {
          identityIssuer: this.identity.issuerId,
          identitySubject: this.identity.subject,
        },
      },
      select: { ownerId: true },
    });
    return session?.ownerId;
  }

  async revokeSession(token: string | undefined) {
    if (token)
      await this.database.ownerSession.deleteMany({
        where: { tokenHash: hashToken(token) },
      });
  }
}
