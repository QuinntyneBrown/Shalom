using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Domain.Entities;

namespace Shalom.Application.Tests.Support;

/// <summary>
/// In-memory DbContext for handler unit tests. Implements IAppDbContext directly
/// so Application code under test never sees Infrastructure.
/// </summary>
internal sealed class TestAppDbContext : DbContext, IAppDbContext
{
    public TestAppDbContext(DbContextOptions<TestAppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();
}
