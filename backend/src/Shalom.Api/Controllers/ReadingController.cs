using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shalom.Application.Contracts;
using Shalom.Application.Reading;

namespace Shalom.Api.Controllers;

[ApiController]
[Route("api/reading")]
[Authorize]
public class ReadingController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReadingController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("plan")]
    public async Task<ActionResult<ReadingPlanDto>> GetPlan(CancellationToken ct)
    {
        return Ok(await _mediator.Send(new GetReadingPlanQuery(), ct));
    }

    /// <summary>Idempotent: completing an already-completed day returns 200 with its original date.</summary>
    [HttpPost("days/{id:guid}/complete")]
    public async Task<ActionResult<ReadingDayDto>> Complete(Guid id, CancellationToken ct)
    {
        return Ok(await _mediator.Send(new CompleteReadingDayCommand(id), ct));
    }

    [HttpDelete("days/{id:guid}/complete")]
    public async Task<IActionResult> Uncomplete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new UncompleteReadingDayCommand(id), ct);
        return NoContent();
    }
}
