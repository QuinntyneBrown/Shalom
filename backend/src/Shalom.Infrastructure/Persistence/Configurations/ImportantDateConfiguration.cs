using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shalom.Domain.Entities;

namespace Shalom.Infrastructure.Persistence.Configurations;

public class ImportantDateConfiguration : IEntityTypeConfiguration<ImportantDate>
{
    public void Configure(EntityTypeBuilder<ImportantDate> b)
    {
        b.ToTable("ImportantDates", t =>
        {
            t.HasCheckConstraint("CK_ImportantDates_Month", "[Month] BETWEEN 1 AND 12");
            t.HasCheckConstraint("CK_ImportantDates_Day", "[Day] BETWEEN 1 AND 31");
            t.HasCheckConstraint("CK_ImportantDates_LeadDays", "[LeadDays] >= 0");
        });
        b.HasKey(x => x.Id);
        b.Property(x => x.Label).HasMaxLength(200).IsRequired();

        // An important date belongs to its person and dies with it.
        b.HasOne<Person>().WithMany().HasForeignKey(x => x.PersonId).OnDelete(DeleteBehavior.Cascade);

        // Restrict (NO ACTION) instead of Cascade: User -> Person -> ImportantDate
        // already cascades, so a cascading User FK would create multiple cascade
        // paths, which SQL Server rejects. Single-user app: user deletion is not a flow.
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}
