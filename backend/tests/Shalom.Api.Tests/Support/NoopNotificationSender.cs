using Shalom.Application.Push;

namespace Shalom.Api.Tests.Support;

/// <summary>Swallows reminder pushes so API tests never touch a real push service.</summary>
public sealed class NoopNotificationSender : INotificationSender
{
    public Task SendToAllAsync(ReminderNotification notification, CancellationToken ct = default)
        => Task.CompletedTask;
}
