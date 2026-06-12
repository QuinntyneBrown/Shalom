using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Reading;

/// <summary>
/// Marks a reading-plan day as read on today's local date (ADR-004).
/// Idempotent: completing an already-completed day is a no-op success that
/// keeps the original completion date.
/// </summary>
public record CompleteReadingDayCommand(Guid DayId) : IRequest<ReadingDayDto>;
