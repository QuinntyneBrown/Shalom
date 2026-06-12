namespace Shalom.Infrastructure.Push;

/// <summary>
/// VAPID configuration for Web Push (M10). Resolution mirrors the JWT
/// signing key: `SHALOM_PUSH_PUBLIC_KEY` / `SHALOM_PUSH_PRIVATE_KEY` env
/// vars first (production), the `Shalom:Push` config section as the dev
/// fallback. The public key is what the client hands to
/// `PushManager.subscribe`; the private key never leaves the server.
/// </summary>
public class PushOptions
{
    public const string SectionName = "Shalom:Push";

    public string PublicKey { get; set; } = string.Empty;
    public string PrivateKey { get; set; } = string.Empty;
    public string Subject { get; set; } = "mailto:quinntynebrown@gmail.com";

    /// <summary>Push is an optional capability — absent keys disable sending, never crash the app.</summary>
    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(PublicKey) && !string.IsNullOrWhiteSpace(PrivateKey);
}
