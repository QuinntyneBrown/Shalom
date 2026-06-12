using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Shalom.Application.Push;
using Shalom.Infrastructure.Push;

namespace Shalom.Api.Controllers;

/// <summary>
/// Web Push subscription endpoints (M10). The VAPID public key is, by
/// definition, public — the client needs it BEFORE it can subscribe, so
/// that endpoint allows anonymous; everything else requires the owner.
/// </summary>
[ApiController]
[Route("api/push")]
[Authorize]
public class PushController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IOptions<PushOptions> _push;

    public PushController(IMediator mediator, IOptions<PushOptions> push)
    {
        _mediator = mediator;
        _push = push;
    }

    public record SubscribeRequest(string Endpoint, string P256dh, string Auth);
    public record UnsubscribeRequest(string Endpoint);
    public record VapidPublicKeyResponse(string PublicKey);

    /// <summary>Registers (or refreshes) this device's subscription. Upsert by endpoint; 204 either way.</summary>
    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] SubscribeRequest req, CancellationToken ct)
    {
        await _mediator.Send(new SubscribeCommand(req.Endpoint, req.P256dh, req.Auth), ct);
        return NoContent();
    }

    /// <summary>Removes the subscription for the endpoint in the body. Idempotent — 204 even when unknown.</summary>
    [HttpDelete("subscribe")]
    public async Task<IActionResult> Unsubscribe([FromBody] UnsubscribeRequest req, CancellationToken ct)
    {
        await _mediator.Send(new UnsubscribeCommand(req.Endpoint), ct);
        return NoContent();
    }

    /// <summary>The VAPID application server key the client passes to `PushManager.subscribe`. 404 until keys are configured.</summary>
    [HttpGet("vapid-public-key")]
    [AllowAnonymous]
    public ActionResult<VapidPublicKeyResponse> VapidPublicKey()
    {
        var options = _push.Value;
        if (!options.IsConfigured) return NotFound();
        return Ok(new VapidPublicKeyResponse(options.PublicKey));
    }
}
