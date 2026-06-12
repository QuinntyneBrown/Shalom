using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shalom.Domain.Entities;

namespace Shalom.Infrastructure.Persistence.Configurations;

public class ReadingPlanDayConfiguration : IEntityTypeConfiguration<ReadingPlanDay>
{
    public void Configure(EntityTypeBuilder<ReadingPlanDay> b)
    {
        b.ToTable("ReadingPlanDays", t =>
            t.HasCheckConstraint("CK_ReadingPlanDays_DayNumber", "[DayNumber] >= 1"));
        b.HasKey(x => x.Id);
        b.Property(x => x.PassageReference).HasMaxLength(100).IsRequired();
        b.Property(x => x.YouVersionUrl).HasMaxLength(300).IsRequired();
        b.HasIndex(x => new { x.ReadingPlanId, x.DayNumber }).IsUnique();
        b.HasOne<ReadingPlan>().WithMany().HasForeignKey(x => x.ReadingPlanId).OnDelete(DeleteBehavior.Cascade);
    }
}
