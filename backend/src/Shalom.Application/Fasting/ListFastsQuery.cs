using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Fasting;

/// <summary>
/// Fasting history for a local-date range (inclusive). A session is in
/// range when it started or ended on a day inside it — a fast that began
/// Sunday evening and completed Monday belongs to both days' stories.
/// Ordered by start, oldest first.
/// </summary>
public record ListFastsQuery(DateOnly From, DateOnly To) : IRequest<IReadOnlyList<FastingSessionDto>>;
