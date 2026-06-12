using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.ImportantDates;

/// <summary>
/// Attaches a recurring date (birthday, anniversary) to a person. Year is
/// optional (unknown birth years are common); LeadDays controls how far
/// ahead the Today surface starts whispering about it.
/// </summary>
public record AddImportantDateCommand(
    Guid PersonId,
    string Label,
    int Month,
    int Day,
    int? Year = null,
    int LeadDays = 7) : IRequest<ImportantDateDto>;
