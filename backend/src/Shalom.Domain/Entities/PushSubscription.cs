namespace Shalom.Domain.Entities;

/// <summary>
/// A Web Push subscription for one installed browser/PWA (M10). Endpoint is
/// the push service URL and is unique — re-subscribing the same device
/// upserts by endpoint. P256dh/Auth are the client encryption keys from
/// `PushSubscription.toJSON().keys`. FailedCount tracks consecutive
/// transient delivery failures; the sender prunes at &gt;= 5 (and immediately
/// on 404/410, the push service's "gone" answers).
/// </summary>
public class PushSubscription
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Endpoint { get; set; } = string.Empty;
    public string P256dh { get; set; } = string.Empty;
    public string Auth { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }

    /// <summary>Last successful delivery (or re-subscribe) — UTC.</summary>
    public DateTimeOffset? LastSeenAt { get; set; }

    /// <summary>Consecutive transient send failures; reset to 0 on success.</summary>
    public int FailedCount { get; set; }
}
