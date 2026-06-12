import { TestBed } from '@angular/core/testing';

import { AuthToken } from '../models/auth-token';
import { User } from '../models/user';
import { AUTH_SERVICE, IAuthService } from './auth.service.contract';
import { SessionStore } from './session-store';

const TOKEN_KEY = 'sh.auth.token';

const user: User = {
  id: 'u-1',
  email: 'ruth@example.com',
  role: 'User',
  emailVerifiedUtc: null,
};

const token: AuthToken = {
  value: 'jwt-token',
  expiresUtc: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};

function makeAuthMock(overrides: Partial<IAuthService> = {}): IAuthService {
  return {
    signUp: async () => ({ token, user }),
    login: async () => ({ token, user }),
    forgotPassword: async () => undefined,
    resendVerification: async () => undefined,
    resetPassword: async () => undefined,
    verifyEmail: async () => undefined,
    me: async () => user,
    ...overrides,
  };
}

function configure(auth: IAuthService): SessionStore {
  TestBed.configureTestingModule({
    providers: [SessionStore, { provide: AUTH_SERVICE, useValue: auth }],
  });
  return TestBed.inject(SessionStore);
}

describe('SessionStore', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('starts signed out and loading', () => {
    const store = configure(makeAuthMock());
    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
    expect(store.loading()).toBe(true);
  });

  it('login sets user + token and persists to localStorage when remembered', async () => {
    const store = configure(makeAuthMock());
    await store.login({ email: user.email, password: 'pw' }, true);

    expect(store.isAuthenticated()).toBe(true);
    expect(store.user()).toEqual(user);
    expect(store.token()?.value).toBe('jwt-token');
    expect(localStorage.getItem(TOKEN_KEY)).toContain('jwt-token');
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(store.rememberedEmail()).toBe(user.email);
  });

  it('login persists to sessionStorage when not remembered', async () => {
    const store = configure(makeAuthMock());
    await store.login({ email: user.email, password: 'pw' }, false);

    expect(sessionStorage.getItem(TOKEN_KEY)).toContain('jwt-token');
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('maps a login rejection onto the error signal', async () => {
    const store = configure(
      makeAuthMock({
        login: async () => {
          throw { code: 'invalid_credentials', message: 'Wrong email or password.' };
        },
      }),
    );

    await expect(store.login({ email: user.email, password: 'nope' }, true)).rejects.toMatchObject(
      { code: 'invalid_credentials' },
    );
    expect(store.error()?.code).toBe('invalid_credentials');
    expect(store.isAuthenticated()).toBe(false);
  });

  it('rehydrate restores the session from a persisted token via me()', async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ value: token.value, expiresUtc: token.expiresUtc }));
    const store = configure(makeAuthMock());

    await store.rehydrate();

    expect(store.loading()).toBe(false);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.token()?.value).toBe(token.value);
  });

  it('rehydrate discards an expired token without calling me()', async () => {
    localStorage.setItem(
      TOKEN_KEY,
      JSON.stringify({ value: 'stale', expiresUtc: new Date(Date.now() - 1000).toISOString() }),
    );
    let meCalled = false;
    const store = configure(
      makeAuthMock({
        me: async () => {
          meCalled = true;
          return user;
        },
      }),
    );

    await store.rehydrate();

    expect(meCalled).toBe(false);
    expect(store.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(store.loading()).toBe(false);
  });

  it('logout clears state and persisted token but keeps the remembered email', async () => {
    const store = configure(makeAuthMock());
    await store.login({ email: user.email, password: 'pw' }, true);

    store.logout();

    expect(store.isAuthenticated()).toBe(false);
    expect(store.token()).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(store.rememberedEmail()).toBe(user.email);
  });
});
