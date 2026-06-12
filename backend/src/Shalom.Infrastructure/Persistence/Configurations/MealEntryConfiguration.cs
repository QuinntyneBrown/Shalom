using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shalom.Domain.Entities;

namespace Shalom.Infrastructure.Persistence.Configurations;

public class MealEntryConfiguration : IEntityTypeConfiguration<MealEntry>
{
    public void Configure(EntityTypeBuilder<MealEntry> b)
    {
        b.ToTable("MealEntries");
        b.HasKey(x => x.Id);
        b.Property(x => x.Text).HasMaxLength(300).IsRequired();
        // Comma-joined tags from the fixed five-word vocabulary; 100 chars
        // comfortably fits all of them at once.
        b.Property(x => x.Tags).HasMaxLength(100).IsRequired();
        b.HasIndex(x => new { x.UserId, x.OccurredAt });
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
