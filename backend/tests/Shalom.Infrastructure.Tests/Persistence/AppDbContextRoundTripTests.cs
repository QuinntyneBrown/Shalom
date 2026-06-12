using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Shalom.Domain.Entities;
using Shalom.Domain.Enums;
using Shalom.Infrastructure.Tests.Support;
using Xunit;

namespace Shalom.Infrastructure.Tests.Persistence;

public class AppDbContextRoundTripTests : IAsyncLifetime
{
    private TestDatabase _db = null!;

    public async Task InitializeAsync() => _db = await TestDatabase.CreateAsync();
    public async Task DisposeAsync() => await _db.DisposeAsync();

    [Fact]
    public async Task User_round_trips()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "Quinn@Example.com",
            NormalizedEmail = "quinn@example.com",
            PasswordHash = "hash-value",
            Role = UserRole.Admin,
            EmailVerifiedUtc = new DateTimeOffset(2026, 6, 12, 9, 0, 0, TimeSpan.Zero),
            CreatedAtUtc = new DateTimeOffset(2026, 6, 1, 8, 0, 0, TimeSpan.Zero),
            UpdatedAtUtc = new DateTimeOffset(2026, 6, 12, 9, 0, 0, TimeSpan.Zero),
        };

        await using (var ctx = _db.CreateContext())
        {
            ctx.Users.Add(user);
            await ctx.SaveChangesAsync();
        }

        await using var read = _db.CreateContext();
        var loaded = await read.Users.SingleAsync(u => u.Id == user.Id);
        loaded.Email.Should().Be("Quinn@Example.com");
        loaded.NormalizedEmail.Should().Be("quinn@example.com");
        loaded.PasswordHash.Should().Be("hash-value");
        loaded.Role.Should().Be(UserRole.Admin);
        loaded.EmailVerifiedUtc.Should().Be(new DateTimeOffset(2026, 6, 12, 9, 0, 0, TimeSpan.Zero));
        loaded.CreatedAtUtc.Should().Be(new DateTimeOffset(2026, 6, 1, 8, 0, 0, TimeSpan.Zero));
    }

    [Fact]
    public async Task User_normalized_email_unique_enforced()
    {
        var email = $"dup_{Guid.NewGuid():N}@example.com";

        await using (var ctx = _db.CreateContext())
        {
            ctx.Users.Add(new User
            {
                Id = Guid.NewGuid(), Email = email, NormalizedEmail = email, PasswordHash = "h"
            });
            await ctx.SaveChangesAsync();
        }

        await using (var ctx = _db.CreateContext())
        {
            ctx.Users.Add(new User
            {
                Id = Guid.NewGuid(), Email = email, NormalizedEmail = email, PasswordHash = "h"
            });
            var act = async () => await ctx.SaveChangesAsync();
            await act.Should().ThrowAsync<DbUpdateException>();
        }
    }

    [Fact]
    public async Task RefreshToken_token_hash_unique_enforced()
    {
        var userId = await SeedUser();
        var hash = $"hash_{Guid.NewGuid():N}";

        await using (var ctx = _db.CreateContext())
        {
            ctx.RefreshTokens.Add(new RefreshToken
            {
                Id = Guid.NewGuid(), UserId = userId, TokenHash = hash,
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(14),
                CreatedAtUtc = DateTimeOffset.UtcNow,
            });
            await ctx.SaveChangesAsync();
        }

        await using (var ctx = _db.CreateContext())
        {
            ctx.RefreshTokens.Add(new RefreshToken
            {
                Id = Guid.NewGuid(), UserId = userId, TokenHash = hash,
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(14),
                CreatedAtUtc = DateTimeOffset.UtcNow,
            });
            var act = async () => await ctx.SaveChangesAsync();
            await act.Should().ThrowAsync<DbUpdateException>();
        }
    }

    [Fact]
    public async Task Deleting_user_cascades_to_auth_tokens()
    {
        var userId = await SeedUser();

        await using (var ctx = _db.CreateContext())
        {
            ctx.RefreshTokens.Add(new RefreshToken
            {
                Id = Guid.NewGuid(), UserId = userId, TokenHash = $"r_{Guid.NewGuid():N}",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(14),
                CreatedAtUtc = DateTimeOffset.UtcNow,
            });
            ctx.PasswordResetTokens.Add(new PasswordResetToken
            {
                Id = Guid.NewGuid(), UserId = userId, TokenHash = $"p_{Guid.NewGuid():N}",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddHours(1),
                CreatedAtUtc = DateTimeOffset.UtcNow,
            });
            ctx.EmailVerificationTokens.Add(new EmailVerificationToken
            {
                Id = Guid.NewGuid(), UserId = userId, TokenHash = $"e_{Guid.NewGuid():N}",
                ExpiresAtUtc = DateTimeOffset.UtcNow.AddHours(24),
                CreatedAtUtc = DateTimeOffset.UtcNow,
            });
            await ctx.SaveChangesAsync();
        }

        await using (var ctx = _db.CreateContext())
        {
            var user = await ctx.Users.SingleAsync(u => u.Id == userId);
            ctx.Users.Remove(user);
            await ctx.SaveChangesAsync();
        }

        await using (var ctx = _db.CreateContext())
        {
            (await ctx.RefreshTokens.AnyAsync(t => t.UserId == userId)).Should().BeFalse();
            (await ctx.PasswordResetTokens.AnyAsync(t => t.UserId == userId)).Should().BeFalse();
            (await ctx.EmailVerificationTokens.AnyAsync(t => t.UserId == userId)).Should().BeFalse();
        }
    }

    private async Task<Guid> SeedUser()
    {
        var id = Guid.NewGuid();
        await using var ctx = _db.CreateContext();
        ctx.Users.Add(new User
        {
            Id = id,
            Email = $"u_{id:N}@example.com",
            NormalizedEmail = $"u_{id:N}@example.com",
            PasswordHash = "h",
        });
        await ctx.SaveChangesAsync();
        return id;
    }
}
