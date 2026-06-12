using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Domain.Entities;

namespace Shalom.Application.Auth;

public class ResendVerificationCommandHandler : IRequestHandler<ResendVerificationCommand, AuthTokenDeliveryDto>
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _tokens;
    private readonly IDateTimeProvider _clock;

    public ResendVerificationCommandHandler(IAppDbContext db, IJwtTokenService tokens, IDateTimeProvider clock)
    {
        _db = db;
        _tokens = tokens;
        _clock = clock;
    }

    public async Task<AuthTokenDeliveryDto> Handle(ResendVerificationCommand request, CancellationToken ct)
    {
        var normalized = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalized, ct);
        if (user is null || user.EmailVerifiedUtc is not null)
            return new AuthTokenDeliveryDto(user?.Email, null, null);

        var now = _clock.UtcNow;
        foreach (var existing in await _db.EmailVerificationTokens
            .Where(t => t.UserId == user.Id && t.ConsumedAtUtc == null && t.ExpiresAtUtc > now)
            .ToListAsync(ct))
        {
            existing.ConsumedAtUtc = now;
        }

        var raw = _tokens.CreateRawRefreshToken();
        var expires = now.AddHours(24);
        _db.EmailVerificationTokens.Add(new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = _tokens.HashRefreshToken(raw),
            CreatedAtUtc = now,
            ExpiresAtUtc = expires,
        });

        await _db.SaveChangesAsync(ct);
        return new AuthTokenDeliveryDto(user.Email, raw, expires);
    }
}
