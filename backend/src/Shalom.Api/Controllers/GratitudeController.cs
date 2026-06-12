using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shalom.Application.Contracts;
using Shalom.Application.Gratitude;

namespace Shalom.Api.Controllers;

[ApiController]
[Route("api/gratitude")]
[Authorize]
public class GratitudeController : ControllerBase
{
    private readonly IMediator _mediator;

    public GratitudeController(IMediator mediator)
    {
        _mediator = mediator;
    }

    public record AddGratitudeRequest(string Text, Guid? PersonId);

    [HttpPost]
    public async Task<ActionResult<GratitudeEntryDto>> Add([FromBody] AddGratitudeRequest req, CancellationToken ct)
    {
        return Ok(await _mediator.Send(new AddGratitudeEntryCommand(req.Text, req.PersonId), ct));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<GratitudeEntryDto>>> List(
        [FromQuery] Guid? personId, [FromQuery] int take = 20, CancellationToken ct = default)
    {
        return Ok(await _mediator.Send(new ListGratitudeQuery(personId, take), ct));
    }
}
