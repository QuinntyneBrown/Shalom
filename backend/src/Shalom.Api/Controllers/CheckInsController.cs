using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shalom.Application.CheckIns;
using Shalom.Application.Contracts;

namespace Shalom.Api.Controllers;

[ApiController]
[Route("api/check-ins")]
[Authorize]
public class CheckInsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CheckInsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    public record UpsertTodayCheckInRequest(int MoodRating, int SpiritualRating, string? Note);

    /// <summary>
    /// Creates or updates today's check-in. The day is derived server-side
    /// in America/Toronto (ADR-004) — no date in the request.
    /// </summary>
    [HttpPut("today")]
    public async Task<ActionResult<CheckInDto>> UpsertToday([FromBody] UpsertTodayCheckInRequest req, CancellationToken ct)
    {
        var dto = await _mediator.Send(
            new UpsertTodayCheckInCommand(req.MoodRating, req.SpiritualRating, req.Note), ct);
        return Ok(dto);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CheckInDto>>> List(
        [FromQuery] DateOnly from, [FromQuery] DateOnly to, CancellationToken ct)
    {
        return Ok(await _mediator.Send(new ListCheckInsQuery(from, to), ct));
    }
}
