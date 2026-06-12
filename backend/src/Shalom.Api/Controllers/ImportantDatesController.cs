using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shalom.Application.ImportantDates;

namespace Shalom.Api.Controllers;

/// <summary>
/// Important dates are created under their person
/// (POST /api/people/{id}/dates) but deleted by their own id.
/// </summary>
[ApiController]
[Route("api/important-dates")]
[Authorize]
public class ImportantDatesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ImportantDatesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>204 on success; 404 when the id is missing or not the caller's.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Remove(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new RemoveImportantDateCommand(id), ct);
        return NoContent();
    }
}
