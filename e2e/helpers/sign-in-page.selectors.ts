/**
 * Selectors for the SignInPage component.
 */
export const signInPageSelectors = {
  /** Selector for SignInButton (button) */
  signInButton: 'button:has-text("Sign in")',
  /** Selector for EmailInput (input) */
  emailInput: "[formControlName='email']",
  /** Selector for PasswordInput (input) */
  passwordInput: "[formControlName='password']",
  /** Selector for RememberInput (input) */
  rememberInput: "[formControlName='remember']",
  /** Selector for ShalomHeading (h1) */
  shalomHeading: 'h1:has-text("Shalom")',
  /** Selector for WelcomeBackBeginTheDayInPeaceText (p) */
  welcomeBackBeginTheDayInPeaceText: 'p:has-text("Welcome back. Begin the day in peace.")',
  /** Selector for EmailText (span) */
  emailText: 'span:has-text("Email")',
  /** Selector for PasswordText (span) */
  passwordText: 'span:has-text("Password")',
  /** Selector for RememberMeText (span) */
  rememberMeText: 'span:has-text("Remember me")',
  /** Selector for Container (div) */
  container: 'div',
} as const;
