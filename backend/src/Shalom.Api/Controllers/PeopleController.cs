using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shalom.Application.Contracts;
using Shalom.Application.ImportantDates;
using Shalom.Application.People;

namespace Shalom.Api.Controllers;

[ApiController]
[Route("api/people")]
[Authorize]
public class PeopleController : ControllerBase
{
    private readonly IMediator _mediator;

    public PeopleController(IMediator mediator)
    {
        _mediator = mediator;
    }

    public record SavePersonRequest(
        string Name,
        string? Relationship,
        string? Phone,
        int? ContactCadenceDays,
        string? Notes);

    public record AddDateRequest(string Label, int Month, int Day, int? Year, int? LeadDays);

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PersonDto>>> List(CancellationToken ct)
    {
        return Ok(await _mediator.Send(new ListPeopleQuery(), ct));
    }

    [HttpPost]
    public async Task<ActionResult<PersonDto>> Create([FromBody] SavePersonRequest req, CancellationToken ct)
    {
        return Ok(await _mediator.Send(new CreatePersonCommand(
            req.Name, req.Relationship, req.Phone, req.ContactCadenceDays, req.Notes), ct));
    }

    /// <summary>
    /// ALL currently-due people with rendered prompts (derived, never
    /// stored — ADR-004). The Today aggregate narrows this to the single
    /// daily nudge.
    /// </summary>
    [HttpGet("nudges")]
    public async Task<ActionResult<IReadOnlyList<ConnectionNudgeDto>>> Nudges(CancellationToken ct)
    {
        return Ok(await _mediator.Send(new GetConnectionNudgesQuery(), ct));
    }

    /// <summary>The person plus their important dates with derived daysUntil.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PersonDetailDto>> Get(Guid id, CancellationToken ct)
    {
        return Ok(await _mediator.Send(new GetPersonQuery(id), ct));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<PersonDto>> Update(Guid id, [FromBody] SavePersonRequest req, CancellationToken ct)
    {
        return Ok(await _mediator.Send(new UpdatePersonCommand(
            id, req.Name, req.Relationship, req.Phone, req.ContactCadenceDays, req.Notes), ct));
    }

    /// <summary>Archive (soft delete) — 204 on success; history is never destroyed.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new ArchivePersonCommand(id), ct);
        return NoContent();
    }

    /// <summary>"Connected" — LastContactedOn becomes the server-local today; any snooze clears.</summary>
    [HttpPost("{id:guid}/contact")]
    public async Task<ActionResult<PersonDto>> RecordContact(Guid id, CancellationToken ct)
    {
        return Ok(await _mediator.Send(new RecordContactCommand(id), ct));
    }

    /// <summary>"Not today" — quiets this person's nudge until tomorrow.</summary>
    [HttpPost("{id:guid}/snooze")]
    public async Task<ActionResult<PersonDto>> Snooze(Guid id, CancellationToken ct)
    {
        return Ok(await _mediator.Send(new SnoozePersonCommand(id), ct));
    }

    [HttpPost("{id:guid}/dates")]
    public async Task<ActionResult<ImportantDateDto>> AddDate(
        Guid id, [FromBody] AddDateRequest req, CancellationToken ct)
    {
        return Ok(await _mediator.Send(new AddImportantDateCommand(
            id, req.Label, req.Month, req.Day, req.Year, req.LeadDays ?? 7), ct));
    }
}
