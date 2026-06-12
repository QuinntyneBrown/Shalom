using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Reading;

/// <summary>Returns the active reading plan with all days and their completion state.</summary>
public record GetReadingPlanQuery : IRequest<ReadingPlanDto>;
