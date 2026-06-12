using Lib.Net.Http.WebPush;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Shalom.Application.Abstractions;
using Shalom.Application.Authentication;
using Shalom.Application.Push;
using Shalom.Infrastructure.Authentication;
using Shalom.Infrastructure.Persistence;
using Shalom.Infrastructure.Push;

namespace Shalom.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>((sp, opt) =>
        {
            var cfg = sp.GetRequiredService<IConfiguration>();
            // Honour the same env var the CLI uses so both the API and the
            // CLI binaries can be pointed at the same database with a
            // single environment variable.
            var cs = Environment.GetEnvironmentVariable("SHALOM_CONNECTION")
                ?? cfg.GetConnectionString("Shalom")
                ?? cfg["Shalom:ConnectionString"]
                ?? throw new InvalidOperationException(
                    "No connection string. Set SHALOM_CONNECTION, ConnectionStrings:Shalom, or Shalom:ConnectionString.");
            opt.UseSqlServer(cs, sql => sql.MigrationsAssembly(typeof(AppDbContext).Assembly.GetName().Name));
        });

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        // Auth. Signing key resolution: env var first (production), config
        // section as fallback for dev. A startup warning fires outside
        // Development if the placeholder is still in play.
        services.Configure<JwtOptions>(o =>
        {
            configuration.GetSection(JwtOptions.SectionName).Bind(o);
            var envKey = Environment.GetEnvironmentVariable("SHALOM_JWT_SIGNING_KEY");
            if (!string.IsNullOrWhiteSpace(envKey)) o.SigningKey = envKey;
        });

        services.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();

        // Web Push (M10). VAPID keys resolve env-var-first, exactly like the
        // JWT signing key above; without keys the sender quietly no-ops.
        services.Configure<PushOptions>(o =>
        {
            configuration.GetSection(PushOptions.SectionName).Bind(o);
            var publicKey = Environment.GetEnvironmentVariable("SHALOM_PUSH_PUBLIC_KEY");
            if (!string.IsNullOrWhiteSpace(publicKey)) o.PublicKey = publicKey;
            var privateKey = Environment.GetEnvironmentVariable("SHALOM_PUSH_PRIVATE_KEY");
            if (!string.IsNullOrWhiteSpace(privateKey)) o.PrivateKey = privateKey;
        });

        services.AddHttpClient<PushServiceClient>();
        services.AddScoped<INotificationSender, WebPushNotificationSender>();

        return services;
    }
}
