/**
 * An invitation to connect — never an obligation. The prompt is rendered
 * server-side so every surface shows identical copy; `phone` powers the
 * sms:/tel: quick actions when present.
 */
export interface ConnectionNudgeDto {
  readonly personId: string;
  readonly name: string;
  readonly relationship: string | null;
  readonly prompt: string;
  readonly phone: string | null;
}
