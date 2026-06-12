/** Body for `POST /api/gratitude`. The server stamps the local day — no date leaves the client. */
export interface AddGratitudeRequest {
  readonly text: string;
  readonly personId?: string | null;
}
