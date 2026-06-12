using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shalom.Domain.Entities;

namespace Shalom.Infrastructure.Persistence.Configurations;

public class ReadingPlanConfiguration : IEntityTypeConfiguration<ReadingPlan>
{
    public void Configure(EntityTypeBuilder<ReadingPlan> b)
    {
        b.ToTable("ReadingPlans");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(200).IsRequired();
        b.HasIndex(x => x.Name).IsUnique();
    }
}
