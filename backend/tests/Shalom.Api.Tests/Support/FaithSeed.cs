using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Shalom.Domain.Entities;
using Shalom.Infrastructure.Persistence;

namespace Shalom.Api.Tests.Support;

/// <summary>
/// Seeds global catalogue rows (verses, reading plans) straight through the
/// DbContext — the API deliberately exposes no write endpoints for them.
/// All helpers are idempotent so tests inside one fixture stay independent.
/// </summary>
public static class FaithSeed
{
    public static async Task EnsureVerseAsync(
        ShalomApiFactory factory, int dayOfYear, string reference, string text, string youVersionUrl)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        if (await db.VersesOfDay.AnyAsync(v => v.DayOfYear == dayOfYear)) return;

        db.VersesOfDay.Add(new VerseOfDay
        {
            Id = Guid.NewGuid(),
            DayOfYear = dayOfYear,
            Reference = reference,
            Text = text,
            YouVersionUrl = youVersionUrl,
        });
        await db.SaveChangesAsync();
    }

    /// <summary>Creates (once) an active plan named <paramref name="name"/> and returns its day ids ordered by day number.</summary>
    public static async Task<IReadOnlyList<Guid>> EnsureActivePlanAsync(
        ShalomApiFactory factory, string name, params string[] passages)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var plan = await db.ReadingPlans.FirstOrDefaultAsync(p => p.Name == name);
        if (plan is null)
        {
            plan = new ReadingPlan
            {
                Id = Guid.NewGuid(),
                Name = name,
                StartDate = new DateOnly(2026, 6, 1),
                IsActive = true,
            };
            db.ReadingPlans.Add(plan);

            for (var i = 0; i < passages.Length; i++)
            {
                db.ReadingPlanDays.Add(new ReadingPlanDay
                {
                    Id = Guid.NewGuid(),
                    ReadingPlanId = plan.Id,
                    DayNumber = i + 1,
                    PassageReference = passages[i],
                    YouVersionUrl = $"https://www.bible.com/bible/111/JHN.{i + 1}",
                });
            }

            await db.SaveChangesAsync();
        }

        return await db.ReadingPlanDays
            .Where(d => d.ReadingPlanId == plan.Id)
            .OrderBy(d => d.DayNumber)
            .Select(d => d.Id)
            .ToListAsync();
    }
}
