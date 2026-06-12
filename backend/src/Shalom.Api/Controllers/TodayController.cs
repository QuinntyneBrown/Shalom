using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shalom.Application.Contracts;
using Shalom.Application.Today;

namespace Shalom.Api.Controllers;

[ApiController]
[Route("api/today")]
[Authorize]
public class TodayController : ControllerBase
{
    private readonly IMediator _mediator;

    public TodayController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<TodayDto>> Get(CancellationToken ct)
    {
        return Ok(await _mediator.Send(new GetTodayQuery(), ct));
    }
}
