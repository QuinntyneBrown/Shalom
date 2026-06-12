using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.People;

/// <summary>One person plus their important dates with derived daysUntil.</summary>
public record GetPersonQuery(Guid Id) : IRequest<PersonDetailDto>;
