using FluentValidation;

namespace Shalom.Application.Push;

public class SubscribeCommandValidator : AbstractValidator<SubscribeCommand>
{
    public SubscribeCommandValidator()
    {
        RuleFor(x => x.Endpoint)
            .NotEmpty()
            .MaximumLength(2000)
            .Must(e => Uri.TryCreate(e, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps)
            .WithMessage("Endpoint must be an absolute https URL.");

        // Base64url key material straight from PushSubscription.toJSON().
        RuleFor(x => x.P256dh).NotEmpty().MaximumLength(256);
        RuleFor(x => x.Auth).NotEmpty().MaximumLength(128);
    }
}
