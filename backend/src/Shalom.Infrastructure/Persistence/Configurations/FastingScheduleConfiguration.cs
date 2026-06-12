using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shalom.Domain.Entities;

namespace Shalom.Infrastructure.Persistence.Configurations;

public class FastingScheduleConfiguration : IEntityTypeConfiguration<FastingSchedule>
{
    public void Configure(EntityTypeBuilder<FastingSchedule> b)
    {
        b.ToTable("FastingSchedules", t =>
            t.HasCheckConstraint("CK_FastingSchedules_TargetFastHours", "[TargetFastHours] > 0"));
        b.HasKey(x => x.Id);
        b.Property(x => x.TimeZoneId).HasMaxLength(100).IsRequired();

        // One schedule per user (ADR-005: "the eating window is configured once").
        b.HasIndex(x => x.UserId).IsUnique();
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);

        // Per-weekday overrides as an owned child table; at most one row per weekday.
        b.OwnsMany(x => x.Overrides, o =>
        {
            o.ToTable("FastingScheduleOverrides");
            o.WithOwner().HasForeignKey("FastingScheduleId");
            o.Property<int>("Id").ValueGeneratedOnAdd();
            o.HasKey("Id");
            o.Property(x => x.DayOfWeek).HasConversion<int>();
            o.HasIndex("FastingScheduleId", nameof(FastingScheduleOverride.DayOfWeek)).IsUnique();
        });
    }
}
