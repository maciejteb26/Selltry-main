import axios from 'axios';
import jwt from 'jsonwebtoken';
import { Platform } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { encrypt } from '../utils/crypto';
import { env } from '../utils/env';
import { prisma } from '../utils/prisma';

interface OAuthStatePayload {
  userId: string;
  platform: 'ALLEGRO';
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

const OAUTH_BASE = env.ALLEGRO_SANDBOX ? 'https://allegro.pl.allegrosandbox.pl' : 'https://allegro.pl';

export function buildAuthorizationUrl(userId: string): string {
  validateOAuthEnv();
  const state = jwt.sign({ userId, platform: 'ALLEGRO' satisfies OAuthStatePayload['platform'] }, env.JWT_SECRET, {
    expiresIn: '10m',
  });
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.ALLEGRO_CLIENT_ID,
    redirect_uri: env.ALLEGRO_REDIRECT_URI,
    state,
  });
  return `${OAUTH_BASE}/auth/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeAndStoreConnection(code: string, state: string): Promise<void> {
  validateOAuthEnv();
  const payload = verifyState(state);
  const tokenResponse = await requestTokens(code);

  const tokenExpiry = new Date(Date.now() + tokenResponse.expires_in * 1000);
  await prisma.userPlatform.upsert({
    where: {
      userId_platform: {
        userId: payload.userId,
        platform: Platform.ALLEGRO,
      },
    },
    create: {
      userId: payload.userId,
      platform: Platform.ALLEGRO,
      isActive: true,
      accessToken: encrypt(tokenResponse.access_token),
      refreshToken: tokenResponse.refresh_token ? encrypt(tokenResponse.refresh_token) : null,
      tokenExpiry,
      connectedAt: new Date(),
    },
    update: {
      isActive: true,
      accessToken: encrypt(tokenResponse.access_token),
      refreshToken: tokenResponse.refresh_token ? encrypt(tokenResponse.refresh_token) : null,
      tokenExpiry,
      connectedAt: new Date(),
    },
  });
}

function verifyState(state: string): OAuthStatePayload {
  try {
    const payload = jwt.verify(state, env.JWT_SECRET) as OAuthStatePayload;
    if (!payload.userId || payload.platform !== 'ALLEGRO') {
      throw new AppError(400, 'Invalid OAuth state');
    }
    return payload;
  } catch {
    throw new AppError(400, 'Invalid or expired OAuth state');
  }
}

async function requestTokens(code: string): Promise<TokenResponse> {
  const tokenUrl = `${OAUTH_BASE}/auth/oauth/token`;
  const auth = Buffer.from(`${env.ALLEGRO_CLIENT_ID}:${env.ALLEGRO_CLIENT_SECRET}`).toString('base64');

  const response = await axios.post<TokenResponse>(
    tokenUrl,
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.ALLEGRO_REDIRECT_URI,
    }),
    {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  return response.data;
}

function validateOAuthEnv(): void {
  if (!env.ALLEGRO_CLIENT_ID || !env.ALLEGRO_CLIENT_SECRET || !env.ALLEGRO_REDIRECT_URI) {
    throw new AppError(
      400,
      'Allegro OAuth is not configured on server. Missing: ALLEGRO_CLIENT_ID, ALLEGRO_CLIENT_SECRET, ALLEGRO_REDIRECT_URI',
    );
  }
}
