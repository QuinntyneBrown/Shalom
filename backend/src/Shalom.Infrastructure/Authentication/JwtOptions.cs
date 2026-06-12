namespace Shalom.Infrastructure.Authentication;

public class JwtOptions
{
    public const string SectionName = "Shalom:Jwt";

    public string Issuer { get; set; } = "shalom";
    public string Audience { get; set; } = "shalom-clients";
    public string SigningKey { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 15;
}
