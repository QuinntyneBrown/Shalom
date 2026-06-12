using MediatR;

namespace Shalom.Application.Push;

/// <summary>
/// Registers (or refreshes) this device's Web Push subscription. Upsert by
/// endpoint: browsers rotate subscriptions silently, and re-enabling on the
/// same device must never strand a dead row next to the live one.
/// </summary>
public record SubscribeCommand(string Endpoint, string P256dh, string Auth) : IRequest;
