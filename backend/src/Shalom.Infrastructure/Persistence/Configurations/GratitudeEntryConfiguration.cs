using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shalom.Domain.Entities;

namespace Shalom.Infrastructure.Persistence.Configurations;

public class GratitudeEntryConfiguration : IEntityTypeConfiguration<GratitudeEntry>
{
    public void Configure(EntityTypeBuilder<GratitudeEntry> b)
    {
        b.ToTable("GratitudeEntries");
        b.HasKey(x => x.Id);
        b.Property(x => x.Text).HasMaxLength(2000).IsRequired();
        b.HasIndex(x => new { x.UserId, x.OccurredOn });

        // Deleting a person keeps the gratitude, just unlinks it.
        b.HasOne<Person>().WithMany().HasForeignKey(x => x.PersonId).OnDelete(DeleteBehavior.SetNull);

        // Restrict (NO ACTION) instead of Cascade: User -> Person already cascades and
        // Person -> GratitudeEntry sets null, so a cascading User FK would create
        // multiple cascade paths, which SQL Server rejects. Single-user app: user
        // deletion is not a flow.
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}
