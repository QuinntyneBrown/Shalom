using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shalom.Domain.Entities;

namespace Shalom.Infrastructure.Persistence.Configurations;

public class PushSubscriptionConfiguration : IEntityTypeConfiguration<PushSubscription>
{
    public void Configure(EntityTypeBuilder<PushSubscription> b)
    {
        b.ToTable("PushSubscriptions");
        b.HasKey(x => x.Id);

        // The endpoint is the upsert identity. Push-service URLs are ASCII
        // (varchar halves the index key size against SQL Server's 1700-byte
        // nonclustered cap) and in practice 200-300 chars; 2000 is headroom.
        b.Property(x => x.Endpoint).HasMaxLength(2000).IsUnicode(false).IsRequired();
        b.HasIndex(x => x.Endpoint).IsUnique();

        // Base64url key material: p256dh is 87 chars, auth 22; generous caps.
        b.Property(x => x.P256dh).HasMaxLength(256).IsRequired();
        b.Property(x => x.Auth).HasMaxLength(128).IsRequired();

        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
