namespace Shalom.Application.Push;

/// <summary>
/// One reminder as the user will see it. Url deep-links into the app
/// (/today, /people/{id}); Tag groups repeats so a re-delivered kind
/// replaces rather than stacks on the lock screen.
/// </summary>
public sealed record ReminderNotification(string Title, string Body, string Url, string Tag);

/// <summary>
/// Delivery boundary for reminder pushes. The Web Push implementation lives
/// in Infrastructure (VAPID, payload encryption, subscription pruning);
/// Application only decides WHAT to whisper and WHEN.
/// </summary>
public interface INotificationSender
{
    /// <summary>Sends to every registered subscription; never throws for per-subscription failures.</summary>
    Task SendToAllAsync(ReminderNotification notification, CancellationToken ct = default);
}
