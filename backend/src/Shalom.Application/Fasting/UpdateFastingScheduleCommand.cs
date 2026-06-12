using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Fasting;

/// <summary>
/// Replaces the eating-window configuration (ADR-005: configured once,
/// per-weekday overrides are first-class). Creates the schedule when none
/// exists yet; overrides are replaced wholesale.
/// </summary>
public record UpdateFastingScheduleCommand(
    TimeOnly WindowStart,
    TimeOnly WindowEnd,
    int TargetFastHours,
    IReadOnlyList<FastingOverrideDto> Overrides) : IRequest<FastingScheduleDto>;
