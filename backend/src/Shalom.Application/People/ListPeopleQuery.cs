using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.People;

/// <summary>Active (non-archived) people, ordered by name.</summary>
public record ListPeopleQuery : IRequest<IReadOnlyList<PersonDto>>;
