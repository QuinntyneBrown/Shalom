using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shalom.Domain.Entities;

namespace Shalom.Infrastructure.Persistence.Configurations;

public class PushSendLogConfiguration : IEntityTypeConfiguration<PushSendLog>
{
    public void Configure(EntityTypeBuilder<PushSendLog> b)
    {
        b.ToTable("PushSendLogs");
        b.HasKey(x => x.Id);
        b.Property(x => x.Kind).HasMaxLength(100).IsRequired();

        // The at-most-once-per-day guarantee, enforced where it must be:
        // even two racing scheduler ticks cannot double-send a kind.
        b.HasIndex(x => new { x.Kind, x.Date }).IsUnique();
    }
}
