using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Shalom.Application.Abstractions;
using Shalom.Application.Common;
using Shalom.Application.Fasting;
using Shalom.Application.Push;
using Shalom.Domain.Entities;
using Shalom.Infrastructure.Push;

namespace Shalom.Api.HostedServices;

/// <summary>
/// The M10 reminder heartbeat: every 60 seconds, decide in America/Toronto
/// local time (ADR-004 — the schedule's TimeZoneId carries the value)
/// whether one of the three whisper-level moments is due, and push it.
///
/// All decision logic lives in the pure <see cref="ReminderPlanner"/>; this
/// service owns only clocks, persistence and delivery. At-most-once per
/// (kind, local day) is a PushSendLog row written BEFORE the send — backed
/// by a unique index, so neither an API restart nor a racing tick can
/// double-tap the owner's shoulder.
///
/// Without VAPID keys (or subscriptions) the service is dormant — push is
/// an optional capability and the app is fully functional without it.
/// </summary>
public sealed class ReminderSchedulerService : BackgroundService
{
    private static readonly TimeSpan TickInterval = TimeSpan.FromSeconds(60);

    /// <summary>Send-log retention; the planner only ever reads today's rows.</summary>
    private const int SendLogRetentionDays = 7;

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IOptions<PushOptions> _push;
    private readonly ILogger<ReminderSchedulerService> _logger;

    public ReminderSchedulerService(
        IServiceScopeFactory scopeFactory,
        IOptions<PushOptions> push,
        ILogger<ReminderSchedulerService> logger)
    {
        _scopeFactory = scopeFactory;
        _push = push;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_push.Value.IsConfigured)
        {
            _logger.LogInformation(
                "Reminder scheduler dormant: no VAPID keys configured (SHALOM_PUSH_PUBLIC_KEY / SHALOM_PUSH_PRIVATE_KEY).");
            return;
        }

        _logger.LogInformation("Reminder scheduler running (every {Interval}).", TickInterval);
        using var timer = new PeriodicTimer(TickInterval);
        try
        {
            do
            {
                try
                {
                    await TickAsync(stoppingToken);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    // A failed tick must never kill the heartbeat.
                    _logger.LogError(ex, "Reminder scheduler tick failed.");
                }
            }
            while (await timer.WaitForNextTickAsync(stoppingToken));
        }
        catch (OperationCanceledException)
        {
            // Normal shutdown.
        }
    }

    private async Task TickAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var clock = scope.ServiceProvider.GetRequiredService<IDateTimeProvider>();
        var sender = scope.ServiceProvider.GetRequiredService<INotificationSender>();

        // No subscribed device, nothing to whisper to.
        var userId = await db.PushSubscriptions.AsNoTracking()
            .Select(s => (Guid?)s.UserId)
            .FirstOrDefaultAsync(ct);
        if (userId is null) return;

        var schedule = await db.FastingSchedules.AsNoTracking()
                .Include(s => s.Overrides)
                .FirstOrDefaultAsync(s => s.UserId == userId, ct)
            ?? FastingDefaults.CreateDefault(userId.Value);

        var localDate = LocalDay.Today(clock, schedule.TimeZoneId);
        var localTime = LocalDay.TimeOf(clock.UtcNow, schedule.TimeZoneId);

        var dates = (await (
                from d in db.ImportantDates.AsNoTracking()
                join p in db.People.AsNoTracking() on d.PersonId equals p.Id
                where d.UserId == userId && !p.IsArchived
                select new { d.Id, PersonId = p.Id, p.Name, d.Label, d.Month, d.Day, d.LeadDays })
            .ToListAsync(ct))
            .Select(x => new ReminderDate(x.Id, x.PersonId, x.Name, x.Label, x.Month, x.Day, x.LeadDays))
            .ToList();

        var sentToday = await db.PushSendLogs.AsNoTracking()
            .Where(l => l.Date == localDate)
            .Select(l => l.Kind)
            .ToListAsync(ct);

        var due = ReminderPlanner.Plan(schedule, dates, localDate, localTime, sentToday.ToHashSet());

        foreach (var reminder in due)
        {
            // Record-then-send: the log row (unique on Kind+Date) is the
            // at-most-once guarantee. Losing a send to a crash beats
            // tapping the shoulder twice.
            var logRow = new PushSendLog
            {
                Id = Guid.NewGuid(),
                Kind = reminder.Kind,
                Date = localDate,
                SentAt = clock.UtcNow,
            };
            db.PushSendLogs.Add(logRow);
            try
            {
                await db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                // A racing tick already claimed this (kind, day).
                db.PushSendLogs.Remove(logRow);
                continue;
            }

            _logger.LogInformation("Sending reminder {Kind} for {Date}.", reminder.Kind, localDate);
            await sender.SendToAllAsync(
                new ReminderNotification(reminder.Title, reminder.Body, reminder.Url, reminder.Kind), ct);
        }

        // Keep the ledger small; only today's rows are ever consulted.
        var cutoff = localDate.AddDays(-SendLogRetentionDays);
        await db.PushSendLogs.Where(l => l.Date < cutoff).ExecuteDeleteAsync(ct);
    }
}
