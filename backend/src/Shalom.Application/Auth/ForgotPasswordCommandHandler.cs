using MediatR;
using Microsoft.EntityFrameworkCore;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Common;
using Shalom.Application.Contracts;
using Shalom.Domain.Entities;

namespace Shalom.Application.Auth;

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, AuthTokenDeliveryDto>
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _tokens;
    private readonly IDateTimeProvider _clock;

    public ForgotPasswordCommandHandler(IAppDbContext db, IJwtTokenService tokens, IDateTimeProvider clock)
    {
        _db = db;
        _tokens = tokens;
        _clock = clock;
    }

    public async Task<AuthTokenDeliveryDto> Handle(ForgotPasswordCommand request, CancellationToken ct)
    {
        var normalized = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalized, ct);
        if (user is null) return new AuthTokenDeliveryDto(null, null, null);

        var now = _clock.UtcNow;
        var raw = _tokens.CreateRawRefreshToken();
        var expires = now.AddMinutes(60);

        foreach (var existing in await _db.PasswordResetTokens
            .Where(t => t.UserId == user.Id && t.ConsumedAtUtc == null && t.ExpiresAtUtc > now)
            .ToListAsync(ct))
        {
            existing.ConsumedAtUtc = now;
        }

        _db.PasswordResetTokens.Add(new PasswordResetToken
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
