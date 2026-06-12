using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Reading;

/// <summary>Clears a reading-plan day's completion. Idempotent.</summary>
public record UncompleteReadingDayCommand(Guid DayId) : IRequest<ReadingDayDto>;
