using MediatR;

namespace Shalom.Application.ImportantDates;

/// <summary>Removes a recurring date. Hard delete — there is no history worth keeping on a reminder.</summary>
public record RemoveImportantDateCommand(Guid Id) : IRequest;
