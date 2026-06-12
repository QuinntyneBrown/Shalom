using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shalom.Domain.Entities;

namespace Shalom.Infrastructure.Persistence.Configurations;

public class DailyCheckInConfiguration : IEntityTypeConfiguration<DailyCheckIn>
{
    public void Configure(EntityTypeBuilder<DailyCheckIn> b)
    {
        b.ToTable("DailyCheckIns", t =>
        {
            t.HasCheckConstraint("CK_DailyCheckIns_MoodRating", "[MoodRating] BETWEEN 1 AND 5");
            t.HasCheckConstraint("CK_DailyCheckIns_SpiritualRating", "[SpiritualRating] BETWEEN 1 AND 4");
        });
        b.HasKey(x => x.Id);
        b.Property(x => x.Note).HasMaxLength(2000);
        b.HasIndex(x => new { x.UserId, x.Date }).IsUnique();
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
