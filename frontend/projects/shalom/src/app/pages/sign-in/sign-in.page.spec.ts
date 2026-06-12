import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';

import { SESSION_STORE } from 'api';
import { SignInPage } from './sign-in.page';

describe('SignInPage', () => {
  let fixture: ComponentFixture<SignInPage>;
  let loginCalls: Array<{ req: { email: string; password: string }; remember: boolean }>;

  beforeEach(async () => {
    loginCalls = [];
    const sessionMock = {
      user: signal(null),
      token: signal(null),
      loading: signal(false),
      error: signal(null),
      rememberedEmail: signal<string | null>(null),
      isAuthenticated: signal(false),
      login: async (req: { email: string; password: string }, remember: boolean) => {
        loginCalls.push({ req, remember });
      },
      logout: () => undefined,
      clearError: () => undefined,
    };

    await TestBed.configureTestingModule({
      imports: [SignInPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: SESSION_STORE, useValue: sessionMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignInPage);
    fixture.detectChanges();
  });

  function setValue(selector: string, value: string): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector(selector);
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('does not call login while the form is invalid', () => {
    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(loginCalls.length).toBe(0);
  });

  it('submits credentials through the session store and navigates to /today', async () => {
    setValue('input[name="email"]', 'ruth@example.com');
    setValue('input[name="password"]', 'secret');
    fixture.detectChanges();

    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(loginCalls).toEqual([
      { req: { email: 'ruth@example.com', password: 'secret' }, remember: true },
    ]);
    expect(TestBed.inject(Router).url).toBe('/today');
  });
});
