using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.People;

/// <summary>
/// "Not today" — quiets this person's nudge until tomorrow. Grace, not
/// guilt: snoozing carries no penalty and no record beyond the date.
/// </summary>
public record SnoozePersonCommand(Guid PersonId) : IRequest<PersonDto>;
