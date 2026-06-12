using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Application.Exceptions;
using Shalom.Application.Fasting;
using Shalom.Application.Meals;
using Shalom.Application.Workouts;

namespace Shalom.Application.Today;

public class GetTodayQueryHandler : IRequestHandler<GetTodayQuery, TodayDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IDateTimeProvider _clock;

    public GetTodayQueryHandler(IAppDbContext db, ICurrentUserAccessor current, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _clock = clock;
    }

    public async Task<TodayDto> Handle(GetTodayQuery request, CancellationToken ct)
    {
        var userId = _current.UserId ?? throw new InvalidCredentialsException();
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new InvalidCredentialsException();

        var today = LocalDay.Today(_clock);

        var checkIn = await _db.DailyCheckIns.AsNoTracking()
            .Where(c => c.UserId == userId && c.Date == today)
            .Select(c => new CheckInDto(c.Id, c.Date, c.MoodRating, c.SpiritualRating, c.Note))
            .FirstOrDefaultAsync(ct);

        var verse = await GetVerseAsync(today, ct);
        var reading = await GetReadingAsync(today, ct);
        var fasting = await GetFastingAsync(userId, today, ct);
        var health = await GetHealthAsync(userId, today, ct);
        var streaks = await GetStreaksAsync(userId, today, ct);

        return new TodayDto(today, GreetingName(user.Email), checkIn, verse, reading, streaks, fasting, health);
    }

    /// <summary>Email prefix until a profile name exists (the User entity has none yet).</summary>
    private static string GreetingName(string email)
    {
        var at = email.IndexOf('@');
        return at > 0 ? email[..at] : email;
    }

    /// <summary>
    /// Verse for the local day-of-year. The catalogue carries 366 rows, but if
    /// row 366 is ever absent on a leap-year Dec 31 we fall back to day 365
    /// rather than failing the whole dashboard.
    /// </summary>
    private async Task<VerseDto> GetVerseAsync(DateOnly today, CancellationToken ct)
    {
        var dayOfYear = today.DayOfYear;
        var verse = await _db.VersesOfDay.AsNoTracking().FirstOrDefaultAsync(v => v.DayOfYear == dayOfYear, ct)
            ?? await _db.VersesOfDay.AsNoTracking().FirstOrDefaultAsync(v => v.DayOfYear == 365, ct)
            ?? throw new NotFoundException("No verse of the day is available.");

        return new VerseDto(verse.Reference, verse.Text, verse.YouVersionUrl);
    }

    /// <summary>
    /// Current day of the active plan: the most recent day completed today
    /// (so the card keeps showing its done state) or else the first
    /// uncompleted day. Null when no plan is active or the plan is finished.
    /// </summary>
    private async Task<TodayReadingDto?> GetReadingAsync(DateOnly today, CancellationToken ct)
    {
        var plan = await _db.ReadingPlans.AsNoTracking().FirstOrDefaultAsync(p => p.IsActive, ct);
        if (plan is null) return null;

        var days = await _db.ReadingPlanDays.AsNoTracking()
            .Where(d => d.ReadingPlanId == plan.Id)
            .OrderBy(d => d.DayNumber)
            .ToListAsync(ct);

        var current = days.LastOrDefault(d => d.CompletedOn == today)
            ?? days.FirstOrDefault(d => d.CompletedOn is null);
        if (current is null) return null;

        return new TodayReadingDto(
            current.Id,
            current.DayNumber,
            current.PassageReference,
            current.YouVersionUrl,
            current.CompletedOn == today,
            plan.Name,
            days.Count(d => d.CompletedOn is not null),
            days.Count);
    }

    /// <summary>
    /// Fasting card state. Read-only by design: when no schedule row exists
    /// yet the defaults are used in-memory — GET /api/fasting/current is the
    /// endpoint that persists the lazy default (ADR-005).
    /// </summary>
    private async Task<TodayFastingDto> GetFastingAsync(Guid userId, DateOnly today, CancellationToken ct)
    {
        var schedule = await _db.FastingSchedules.AsNoTracking()
            .Include(s => s.Overrides)
            .FirstOrDefaultAsync(s => s.UserId == userId, ct)
            ?? FastingDefaults.CreateDefault(userId);

        var open = await _db.FastingSessions.AsNoTracking()
            .Where(s => s.UserId == userId && s.EndedAt == null)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync(ct);

        var window = FastingMapping.TodayWindowFor(schedule, today);
        var localNow = LocalDay.TimeOf(_clock.UtcNow, schedule.TimeZoneId);
        var windowOpen = localNow >= window.Start && localNow < window.End;

        return new TodayFastingDto(
            open is null ? null : FastingMapping.ToDto(open, _clock.UtcNow),
            window,
            windowOpen,
            schedule.TargetFastHours);
    }

    private async Task<TodayHealthDto> GetHealthAsync(Guid userId, DateOnly today, CancellationToken ct)
    {
        var startUtc = LocalDay.StartOfDayUtc(today);
        var endUtc = LocalDay.EndOfDayUtcExclusive(today);

        var todaysWorkouts = await _db.Workouts.AsNoTracking()
            .Where(w => w.UserId == userId && w.StartedAt >= startUtc && w.StartedAt < endUtc)
            .OrderBy(w => w.StartedAt)
            .ToListAsync(ct);

        var lastMeal = await _db.MealEntries.AsNoTracking()
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.OccurredAt)
            .FirstOrDefaultAsync(ct);

        return new TodayHealthDto(
            todaysWorkouts.Select(LogWorkoutCommandHandler.ToDto).ToList(),
            lastMeal is null ? null : LogMealCommandHandler.ToDto(lastMeal));
    }

    private async Task<TodayStreaksDto> GetStreaksAsync(Guid userId, DateOnly today, CancellationToken ct)
    {
        var checkInDates = await _db.DailyCheckIns.AsNoTracking()
            .Where(c => c.UserId == userId)
            .Select(c => c.Date)
            .ToListAsync(ct);

        // Reading completion lives on the (global) plan-day rows themselves —
        // Shalom is single-user, so every completion belongs to this user.
        var readingDates = await _db.ReadingPlanDays.AsNoTracking()
            .Where(d => d.CompletedOn != null)
            .Select(d => d.CompletedOn!.Value)
            .ToListAsync(ct);

        // Fasting streak: a day counts when a fast that reached its target
        // ENDED on it — a 16h fast started Sunday 8pm completes Monday noon,
        // and Monday is the day that earned it. Outcome derived, not stored.
        var endedSessions = await _db.FastingSessions.AsNoTracking()
            .Where(s => s.UserId == userId && s.EndedAt != null)
            .Select(s => new { s.StartedAt, EndedAt = s.EndedAt!.Value, s.TargetHours })
            .ToListAsync(ct);
        var fastingDates = endedSessions
            .Where(s => (s.EndedAt - s.StartedAt).TotalHours >= s.TargetHours)
            .Select(s => LocalDay.DateOf(s.EndedAt))
            .ToHashSet();

        var movementDates = (await _db.Workouts.AsNoTracking()
                .Where(w => w.UserId == userId)
                .Select(w => w.StartedAt)
                .ToListAsync(ct))
            .Select(t => LocalDay.DateOf(t))
            .ToHashSet();

        var checkIns = StreakCalculator.Calculate(checkInDates.ToHashSet(), today);
        var reading = StreakCalculator.Calculate(readingDates.ToHashSet(), today);
        var fasting = StreakCalculator.Calculate(fastingDates, today);
        var movement = StreakCalculator.Calculate(movementDates, today);

        return new TodayStreaksDto(
            checkIns.Current, checkIns.Longest,
            reading.Current, reading.Longest,
            fasting.Current, fasting.Longest,
            movement.Current, movement.Longest);
    }
}
