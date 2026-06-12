using Shalom.Application.Authentication;

namespace Shalom.Application.Tests.Support;

internal sealed class StubPasswordHasher : IPasswordHasher
{
    public string Hash(string password) => $"hashed::{password}";
    public bool Verify(string hash, string password) => hash == $"hashed::{password}";
}
