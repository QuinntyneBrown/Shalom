using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Shalom.Domain.Entities;
using Shalom.Infrastructure.Persistence;

namespace Shalom.Cli.Seed;

/// <summary>
/// Seeds the global reading-plan catalogue. Idempotent: plans are keyed by
/// Name and days by (plan, DayNumber) — re-running updates in place and never
/// duplicates or touches CompletedOn.
/// </summary>
public sealed class ReadingPlanSeeder : IJsonSeeder
{
    public string FileName => "reading-plan.json";

    public async Task<int> SeedAsync(AppDbContext db, Stream json, CancellationToken ct)
    {
        var records = await JsonSerializer.DeserializeAsync<List<PlanRecord>>(
            json, SeedJsonOptions.Default, ct);
        if (records is null || records.Count == 0)
            return 0;

        var written = 0;

        foreach (var record in records)
        {
            if (string.IsNullOrWhiteSpace(record.Name))
                continue;

            var name = record.Name.Trim();
            var plan = db.ReadingPlans.Local.FirstOrDefault(p => p.Name == name)
                ?? await db.ReadingPlans.FirstOrDefaultAsync(p => p.Name == name, ct);

            if (plan is null)
            {
                plan = new ReadingPlan
                {
                    Id = Guid.NewGuid(),
                    Name = name,
                    StartDate = record.StartDate ?? default,
                    IsActive = record.IsActive ?? false,
                };
                db.ReadingPlans.Add(plan);
            }
            else
            {
                plan.StartDate = record.StartDate ?? plan.StartDate;
                plan.IsActive = record.IsActive ?? plan.IsActive;
            }

            written++;

            if (record.Days is null)
                continue;

            var planId = plan.Id;
            var existingDays = await db.ReadingPlanDays
                .Where(d => d.ReadingPlanId == planId)
                .ToDictionaryAsync(d => d.DayNumber, ct);
            foreach (var local in db.ReadingPlanDays.Local.Where(d => d.ReadingPlanId == planId))
                existingDays[local.DayNumber] = local;

            var seen = new HashSet<int>();

            foreach (var day in record.Days)
            {
                if (day.DayNumber < 1 ||
                    string.IsNullOrWhiteSpace(day.PassageReference) ||
                    string.IsNullOrWhiteSpace(day.YouVersionUrl) ||
                    !seen.Add(day.DayNumber))
                    continue;

                if (existingDays.TryGetValue(day.DayNumber, out var row))
                {
                    row.PassageReference = day.PassageReference.Trim();
                    row.YouVersionUrl = day.YouVersionUrl.Trim();
                }
                else
                {
                    db.ReadingPlanDays.Add(new ReadingPlanDay
                    {
                        Id = Guid.NewGuid(),
                        ReadingPlanId = planId,
                        DayNumber = day.DayNumber,
                        PassageReference = day.PassageReference.Trim(),
                        YouVersionUrl = day.YouVersionUrl.Trim(),
                    });
                }

                written++;
            }
        }

        return written;
    }

    private sealed record PlanRecord(
        string Name,
        DateOnly? StartDate,
        bool? IsActive,
        List<DayRecord>? Days);

    private sealed record DayRecord(
        int DayNumber,
        string PassageReference,
        string YouVersionUrl);
}
