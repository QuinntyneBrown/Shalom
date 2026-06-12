using Microsoft.EntityFrameworkCore;
using Shalom.Domain.Entities;

namespace Shalom.Application.Abstractions;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<PasswordResetToken> PasswordResetTokens { get; }
    DbSet<EmailVerificationToken> EmailVerificationTokens { get; }
    DbSet<DailyCheckIn> DailyCheckIns { get; }
    DbSet<ReadingPlan> ReadingPlans { get; }
    DbSet<ReadingPlanDay> ReadingPlanDays { get; }
    DbSet<VerseOfDay> VersesOfDay { get; }
    DbSet<Workout> Workouts { get; }
    DbSet<FastingSession> FastingSessions { get; }
    DbSet<FastingSchedule> FastingSchedules { get; }
    DbSet<Person> People { get; }
    DbSet<GratitudeEntry> GratitudeEntries { get; }
    DbSet<ImportantDate> ImportantDates { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
