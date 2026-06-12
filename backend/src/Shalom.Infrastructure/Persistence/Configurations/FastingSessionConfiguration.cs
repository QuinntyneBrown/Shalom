using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shalom.Domain.Entities;

namespace Shalom.Infrastructure.Persistence.Configurations;

public class FastingSessionConfiguration : IEntityTypeConfiguration<FastingSession>
{
    public void Configure(EntityTypeBuilder<FastingSession> b)
    {
        b.ToTable("FastingSessions", t =>
            t.HasCheckConstraint("CK_FastingSessions_TargetHours", "[TargetHours] > 0"));
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.UserId, x.StartedAt });
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
