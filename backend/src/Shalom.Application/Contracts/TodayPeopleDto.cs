namespace Shalom.Application.Contracts;

/// <summary>
/// The connection slice of the Today aggregate. At most ONE nudge per day,
/// and none at all once any contact was recorded today — relationships are
/// invitations, never obligations (and never streaks).
/// </summary>
public record TodayPeopleDto(
    ConnectionNudgeDto? Nudge,
    IReadOnlyList<UpcomingDateDto> UpcomingDates,
    PrayerFocusDto PrayerFocus);
