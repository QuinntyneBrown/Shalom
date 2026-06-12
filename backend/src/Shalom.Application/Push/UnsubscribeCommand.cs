using MediatR;

namespace Shalom.Application.Push;

/// <summary>
/// Removes this device's subscription by endpoint. Idempotent by design —
/// unsubscribing an endpoint the server already forgot is success, not 404
/// (the browser side may have pruned it first).
/// </summary>
public record UnsubscribeCommand(string Endpoint) : IRequest;
