using MediatR;
using Shalom.Application.Contracts;

namespace Shalom.Application.Today;

/// <summary>The Today dashboard aggregate — one round trip for the whole surface.</summary>
public record GetTodayQuery : IRequest<TodayDto>;
