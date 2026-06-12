using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shalom.Application.Contracts;
using Shalom.Application.Meals;

namespace Shalom.Api.Controllers;

[ApiController]
[Route("api/meals")]
[Authorize]
public class MealsController : ControllerBase
{
    private readonly IMediator _mediator;

    public MealsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    public record LogMealRequest(string Text, List<string>? Tags);

    [HttpPost]
    public async Task<ActionResult<MealEntryDto>> Log([FromBody] LogMealRequest req, CancellationToken ct)
    {
        return Ok(await _mediator.Send(new LogMealCommand(req.Text, req.Tags ?? []), ct));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MealEntryDto>>> List(
        [FromQuery] DateOnly from, [FromQuery] DateOnly to, CancellationToken ct)
    {
        return Ok(await _mediator.Send(new ListMealsQuery(from, to), ct));
    }
}
