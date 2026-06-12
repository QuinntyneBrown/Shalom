using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shalom.Application.Contracts;
using Shalom.Application.Workouts;
using Shalom.Domain.Enums;

namespace Shalom.Api.Controllers;

[ApiController]
[Route("api/workouts")]
[Authorize]
public class WorkoutsController : ControllerBase
{
    private readonly IMediator _mediator;

    public WorkoutsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    public record LogWorkoutRequest(
        EquipmentType Equipment,
        int DurationMinutes,
        DateTimeOffset? StartedAt,
        decimal? DistanceKm,
        int? AvgHeartRateBpm,
        int? ActiveCalories,
        string? Notes);

    [HttpPost]
    public async Task<ActionResult<WorkoutDto>> Log([FromBody] LogWorkoutRequest req, CancellationToken ct)
    {
        var dto = await _mediator.Send(new LogWorkoutCommand(
            req.Equipment, req.DurationMinutes, req.StartedAt,
            req.DistanceKm, req.AvgHeartRateBpm, req.ActiveCalories, req.Notes), ct);
        return Ok(dto);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<WorkoutDto>>> List(
        [FromQuery] DateOnly from, [FromQuery] DateOnly to, CancellationToken ct)
    {
        return Ok(await _mediator.Send(new ListWorkoutsQuery(from, to), ct));
    }

    /// <summary>204 on success; 404 when the id is missing or not the caller's.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteWorkoutCommand(id), ct);
        return NoContent();
    }
}
