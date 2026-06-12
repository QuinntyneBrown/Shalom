using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Gratitude;

/// <summary>
/// Most recent gratitude notes, newest first — optionally only those tied
/// to one person (the person-detail card).
/// </summary>
public record ListGratitudeQuery(Guid? PersonId = null, int Take = 20) : IRequest<IReadOnlyList<GratitudeEntryDto>>;
