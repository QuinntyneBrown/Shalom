using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Domain.Entities;

namespace Shalom.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();
    public DbSet<DailyCheckIn> DailyCheckIns => Set<DailyCheckIn>();
    public DbSet<ReadingPlan> ReadingPlans => Set<ReadingPlan>();
    public DbSet<ReadingPlanDay> ReadingPlanDays => Set<ReadingPlanDay>();
    public DbSet<VerseOfDay> VersesOfDay => Set<VerseOfDay>();
    public DbSet<Workout> Workouts => Set<Workout>();
    public DbSet<FastingSession> FastingSessions => Set<FastingSession>();
    public DbSet<FastingSchedule> FastingSchedules => Set<FastingSchedule>();
    public DbSet<MealEntry> MealEntries => Set<MealEntry>();
    public DbSet<Person> People => Set<Person>();
    public DbSet<GratitudeEntry> GratitudeEntries => Set<GratitudeEntry>();
    public DbSet<ImportantDate> ImportantDates => Set<ImportantDate>();
    public DbSet<PushSubscription> PushSubscriptions => Set<PushSubscription>();
    public DbSet<PushSendLog> PushSendLogs => Set<PushSendLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
