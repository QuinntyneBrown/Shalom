using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.CheckIns;

/// <summary>
/// Creates or updates today's check-in. "Today" is derived server-side in
/// America/Toronto (ADR-004) — the client never sends a date.
/// </summary>
public record UpsertTodayCheckInCommand(int MoodRating, int SpiritualRating, string? Note) : IRequest<CheckInDto>;
