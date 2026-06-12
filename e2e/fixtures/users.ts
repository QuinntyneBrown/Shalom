/** Credentials seeded by `shalom seed` (backend/src/Shalom.Cli/Seed/Data/users.json). */
export const SEEDED_USER = {
  email: 'quinntynebrown@gmail.com',
  password: 'password123',
  /** Greeting name derived server-side from the email prefix. */
  greetingName: 'quinntynebrown',
} as const;
