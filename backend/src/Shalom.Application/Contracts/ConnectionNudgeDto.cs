namespace Shalom.Application.Contracts;

/// <summary>
/// An invitation to connect — never an obligation. Carries the rendered
/// prompt so every surface shows identical copy, and the phone so the
/// client can offer sms:/tel: quick actions.
/// </summary>
public record ConnectionNudgeDto(
    Guid PersonId,
    string Name,
    string? Relationship,
    string Prompt,
    string? Phone);
