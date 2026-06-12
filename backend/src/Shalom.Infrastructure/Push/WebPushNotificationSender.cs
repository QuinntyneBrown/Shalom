using System.Net;
using System.Text.Json;
using Lib.Net.Http.WebPush;
using Lib.Net.Http.WebPush.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Shalom.Application.Abstractions;
using Shalom.Application.Common;
using Shalom.Application.Push;

namespace Shalom.Infrastructure.Push;

/// <summary>
/// Web Push delivery via Lib.Net.Http.WebPush (VAPID). The payload is the
/// EXACT shape the Angular service worker shows natively (verified against
/// @angular/service-worker 21.2 `ngsw-worker.js`):
///
///   { "notification": { "title", "body", "icon", "badge", "tag",
///       "data": { "url", "onActionClick": { "default": {
///           "operation": "focusLastFocusedOrOpen", "url" } } } } }
///
/// ngsw shows nothing without `notification.title`; clicking runs
/// `data.onActionClick.default` inside the worker (app closed) and
/// broadcasts NOTIFICATION_CLICK to `SwPush.notificationClicks` (app open).
///
/// Subscription hygiene per the push spec: 410 Gone / 404 Not Found mean
/// the subscription is dead — remove it; transient failures bump
/// FailedCount and prune at &gt;= 5; success resets the counter.
/// </summary>
public class WebPushNotificationSender : INotificationSender
{
    /// <summary>Reminders are moments; an hour later they are noise. Push services drop them after this.</summary>
    private const int TimeToLiveSeconds = 3600;

    private const int MaxFailedCount = 5;

    private readonly PushServiceClient _client;
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;
    private readonly PushOptions _options;
    private readonly ILogger<WebPushNotificationSender> _logger;

    public WebPushNotificationSender(
        PushServiceClient client,
        IAppDbContext db,
        IDateTimeProvider clock,
        IOptions<PushOptions> options,
        ILogger<WebPushNotificationSender> logger)
    {
        _client = client;
        _db = db;
        _clock = clock;
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendToAllAsync(ReminderNotification notification, CancellationToken ct = default)
    {
        if (!_options.IsConfigured)
        {
            _logger.LogDebug("Push not configured (no VAPID keys); dropping '{Tag}'.", notification.Tag);
            return;
        }

        var subscriptions = await _db.PushSubscriptions.ToListAsync(ct);
        if (subscriptions.Count == 0) return;

        using var auth = new VapidAuthentication(_options.PublicKey, _options.PrivateKey)
        {
            Subject = _options.Subject,
        };
        var content = BuildNgswPayload(notification);

        foreach (var subscription in subscriptions)
        {
            // PushMessage.HttpContent is single-use; build one per delivery.
            var message = new PushMessage(content) { TimeToLive = TimeToLiveSeconds };
            var target = new Lib.Net.Http.WebPush.PushSubscription { Endpoint = subscription.Endpoint };
            target.SetKey(PushEncryptionKeyName.P256DH, subscription.P256dh);
            target.SetKey(PushEncryptionKeyName.Auth, subscription.Auth);

            try
            {
                await _client.RequestPushMessageDeliveryAsync(target, message, auth, ct);
                subscription.LastSeenAt = _clock.UtcNow;
                subscription.FailedCount = 0;
            }
            catch (PushServiceClientException ex) when (
                ex.StatusCode is HttpStatusCode.Gone or HttpStatusCode.NotFound)
            {
                // The push service says this subscription no longer exists.
                _logger.LogInformation(
                    "Pruning gone push subscription ({StatusCode}): {Endpoint}",
                    (int)ex.StatusCode, subscription.Endpoint);
                _db.PushSubscriptions.Remove(subscription);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                subscription.FailedCount++;
                _logger.LogWarning(
                    ex,
                    "Push delivery failed (attempt {FailedCount}) for {Endpoint}",
                    subscription.FailedCount, subscription.Endpoint);
                if (subscription.FailedCount >= MaxFailedCount)
                {
                    _logger.LogInformation(
                        "Pruning push subscription after {FailedCount} consecutive failures: {Endpoint}",
                        subscription.FailedCount, subscription.Endpoint);
                    _db.PushSubscriptions.Remove(subscription);
                }
            }
        }

        await _db.SaveChangesAsync(ct);
    }

    /// <summary>The ngsw-native payload — see the class remarks for the verified contract.</summary>
    internal static string BuildNgswPayload(ReminderNotification n) =>
        JsonSerializer.Serialize(new
        {
            notification = new
            {
                title = n.Title,
                body = n.Body,
                icon = "icons/icon-192.png",
                badge = "icons/icon-192.png",
                tag = n.Tag,
                data = new
                {
                    url = n.Url,
                    onActionClick = new
                    {
                        @default = new { operation = "focusLastFocusedOrOpen", url = n.Url },
                    },
                },
            },
        });
}
