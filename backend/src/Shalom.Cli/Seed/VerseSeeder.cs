using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Shalom.Domain.Entities;
using Shalom.Infrastructure.Persistence;

namespace Shalom.Cli.Seed;

/// <summary>
/// Seeds the global verse-of-the-day catalogue (World English Bible text).
/// Idempotent: rows are keyed by DayOfYear — existing rows are updated in
/// place, never duplicated.
/// </summary>
public sealed class VerseSeeder : IJsonSeeder
{
    public string FileName => "verses-web.json";

    public async Task<int> SeedAsync(AppDbContext db, Stream json, CancellationToken ct)
    {
        var records = await JsonSerializer.DeserializeAsync<List<VerseRecord>>(
            json, SeedJsonOptions.Default, ct);
        if (records is null || records.Count == 0)
            return 0;

        var existing = await db.VersesOfDay.ToDictionaryAsync(v => v.DayOfYear, ct);
        foreach (var local in db.VersesOfDay.Local)
            existing[local.DayOfYear] = local;

        var written = 0;
        var seen = new HashSet<int>();

        foreach (var record in records)
        {
            if (record.DayOfYear is < 1 or > 366 ||
                string.IsNullOrWhiteSpace(record.Reference) ||
                string.IsNullOrWhiteSpace(record.Text) ||
                string.IsNullOrWhiteSpace(record.YouVersionUrl) ||
                !seen.Add(record.DayOfYear))
                continue;

            if (existing.TryGetValue(record.DayOfYear, out var row))
            {
                row.Reference = record.Reference.Trim();
                row.Text = record.Text.Trim();
                row.YouVersionUrl = record.YouVersionUrl.Trim();
            }
            else
            {
                db.VersesOfDay.Add(new VerseOfDay
                {
                    Id = Guid.NewGuid(),
                    DayOfYear = record.DayOfYear,
                    Reference = record.Reference.Trim(),
                    Text = record.Text.Trim(),
                    YouVersionUrl = record.YouVersionUrl.Trim(),
                });
            }

            written++;
        }

        return written;
    }

    private sealed record VerseRecord(
        int DayOfYear,
        string Reference,
        string Text,
        string YouVersionUrl);
}
