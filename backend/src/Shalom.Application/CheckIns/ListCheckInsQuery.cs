using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.CheckIns;

/// <summary>Lists the current user's check-ins with <c>From &lt;= Date &lt;= To</c>, ordered by date.</summary>
public record ListCheckInsQuery(DateOnly From, DateOnly To) : IRequest<IReadOnlyList<CheckInDto>>;
