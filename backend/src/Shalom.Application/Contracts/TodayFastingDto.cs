namespace Shalom.Application.Contracts;

/// <summary>
/// Fasting pillar of the Today aggregate: the open session (if any), today's
/// eating window, whether "now" sits inside it (local, ADR-004), and the
/// schedule's target for today.
/// </summary>
public record TodayFastingDto(
    FastingSessionDto? Current,
    TodayWindowDto TodayWindow,
    bool WindowOpen,
    int TargetHours);
