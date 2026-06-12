using MediatR;

namespace Shalom.Application.People;

/// <summary>
/// Soft-removes a person (DELETE verb, archive semantics): history —
/// gratitude, dates, last-contact — is never destroyed, the person just
/// leaves the list and the nudge pool.
/// </summary>
public record ArchivePersonCommand(Guid Id) : IRequest;
