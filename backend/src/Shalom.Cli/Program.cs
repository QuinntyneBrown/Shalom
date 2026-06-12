using System.CommandLine;
using Shalom.Cli;

return await RootCommandFactory.Create(args).InvokeAsync(args);
