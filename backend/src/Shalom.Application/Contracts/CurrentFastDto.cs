namespace Shalom.Application.Contracts;

/// <summary>
/// The fasting surface in one round trip: the open session (if any) and the
/// schedule with today's computed eating window.
/// </summary>
public record CurrentFastDto(
    FastingSessionDto? Current,
    FastingScheduleDto Schedule);
