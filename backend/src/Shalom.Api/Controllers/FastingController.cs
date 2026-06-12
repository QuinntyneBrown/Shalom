using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shalom.Application.Contracts;
using Shalom.Application.Fasting;

namespace Shalom.Api.Controllers;

[ApiController]
[Route("api/fasting")]
[Authorize]
public class FastingController : ControllerBase
{
    private readonly IMediator _mediator;

    public FastingController(IMediator mediator)
    {
        _mediator = mediator;
    }

    public record StartFastRequest(int? TargetHours);
    public record UpdateScheduleRequest(
        TimeOnly WindowStart,
        TimeOnly WindowEnd,
        int TargetFastHours,
        List<FastingOverrideDto> Overrides);

    /// <summary>
    /// The fasting surface in one round trip: open session + schedule with
    /// today's computed window. Lazily creates the default schedule
    /// (ADR-005: the 6am screen needs zero prior input).
    /// </summary>
    [HttpGet("current")]
    public async Task<ActionResult<CurrentFastDto>> GetCurrent(CancellationToken ct)
    {
        return Ok(await _mediator.Send(new GetCurrentFastQuery(), ct));
    }

    /// <summary>Starts a fast now. 409 when one is already open.</summary>
    [HttpPost("start")]
    public async Task<ActionResult<FastingSessionDto>> Start([FromBody] StartFastRequest req, CancellationToken ct)
    {
        return Ok(await _mediator.Send(new StartFastCommand(req.TargetHours), ct));
    }

    /// <summary>Ends the open fast now. 404 when none is running.</summary>
    [HttpPost("current/end")]
    public async Task<ActionResult<FastingSessionDto>> End(CancellationToken ct)
    {
        return Ok(await _mediator.Send(new EndFastCommand(), ct));
    }

    [HttpGet("history")]
    public async Task<ActionResult<IReadOnlyList<FastingSessionDto>>> History(
        [FromQuery] DateOnly from, [FromQuery] DateOnly to, CancellationToken ct)
    {
        return Ok(await _mediator.Send(new ListFastsQuery(from, to), ct));
    }

    [HttpPut("schedule")]
    public async Task<ActionResult<FastingScheduleDto>> UpdateSchedule(
        [FromBody] UpdateScheduleRequest req, CancellationToken ct)
    {
        return Ok(await _mediator.Send(
            new UpdateFastingScheduleCommand(req.WindowStart, req.WindowEnd, req.TargetFastHours, req.Overrides), ct));
    }
}
