using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Shalom.Domain.Entities;

namespace Shalom.Infrastructure.Persistence.Configurations;

public class WorkoutConfiguration : IEntityTypeConfiguration<Workout>
{
    public void Configure(EntityTypeBuilder<Workout> b)
    {
        b.ToTable("Workouts", t =>
            t.HasCheckConstraint("CK_Workouts_DurationMinutes", "[DurationMinutes] > 0"));
        b.HasKey(x => x.Id);
        b.Property(x => x.Equipment).HasConversion<int>();
        b.Property(x => x.DistanceKm).HasPrecision(6, 2);
        b.Property(x => x.Notes).HasMaxLength(2000);
        b.HasIndex(x => new { x.UserId, x.StartedAt });
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
