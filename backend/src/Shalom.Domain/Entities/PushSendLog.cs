namespace Shalom.Domain.Entities;

/// <summary>
/// At-most-once ledger for reminder pushes (M10): one row per (Kind, local
/// Date) means a notification kind fires at most once per day and the
/// guarantee survives API restarts. Kind is a small string key — e.g.
/// "window-open", "window-closing", "date-lead:{importantDateId}".
/// Rows older than a week are pruned by the scheduler.
/// </summary>
public class PushSendLog
{
    public Guid Id { get; set; }
    public string Kind { get; set; } = string.Empty;

    /// <summary>The America/Toronto local date the send belongs to (ADR-004).</summary>
    public DateOnly Date { get; set; }

    public DateTimeOffset SentAt { get; set; }
}
