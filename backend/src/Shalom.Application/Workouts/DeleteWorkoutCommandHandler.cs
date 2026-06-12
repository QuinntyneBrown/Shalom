using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Exceptions;

namespace Shalom.Application.Workouts;

public class DeleteWorkoutCommandHandler : IRequestHandler<DeleteWorkoutCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;

    public DeleteWorkoutCommandHandler(IAppDbContext db, ICurrentUserAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task Handle(DeleteWorkoutCommand request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();

        // Ownership folded into the lookup: someone else's workout id reads
        // as "not found", never "forbidden" — no existence oracle.
        var workout = await _db.Workouts
            .FirstOrDefaultAsync(w => w.Id == request.Id && w.UserId == userId, ct)
            ?? throw new NotFoundException($"Workout '{request.Id}' was not found.");

        _db.Workouts.Remove(workout);
        await _db.SaveChangesAsync(ct);
    }
}
