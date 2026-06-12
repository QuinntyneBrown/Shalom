using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shalom.Domain.Entities;

namespace Shalom.Infrastructure.Persistence.Configurations;

public class VerseOfDayConfiguration : IEntityTypeConfiguration<VerseOfDay>
{
    public void Configure(EntityTypeBuilder<VerseOfDay> b)
    {
        b.ToTable("VersesOfDay", t =>
            t.HasCheckConstraint("CK_VersesOfDay_DayOfYear", "[DayOfYear] BETWEEN 1 AND 366"));
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.DayOfYear).IsUnique();
        b.Property(x => x.Reference).HasMaxLength(100).IsRequired();
        b.Property(x => x.Text).HasMaxLength(2000).IsRequired();
        b.Property(x => x.YouVersionUrl).HasMaxLength(300).IsRequired();
    }
}
