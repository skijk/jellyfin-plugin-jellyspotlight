using System.Reflection;
using System.Runtime.Loader;
using MediaBrowser.Model.Tasks;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Plugin.JellySpotlight.Services;

public sealed class StartupTask : IScheduledTask
{
    private static readonly Guid TransformationId = Guid.Parse("4c03e43c-c247-468c-83ea-4ea4721a82c8");
    private readonly ILogger<StartupTask> _logger;
    public StartupTask(ILogger<StartupTask> logger) => _logger = logger;
    public string Name => "JellySpotlight Startup";
    public string Key => "JellySpotlight.Startup";
    public string Description => "Registers JellySpotlight with Jellyfin Web.";
    public string Category => "Startup Services";

    public Task ExecuteAsync(IProgress<double> progress, CancellationToken cancellationToken)
    {
        var assembly = AssemblyLoadContext.All.SelectMany(x => x.Assemblies)
            .FirstOrDefault(x => x.FullName?.Contains(".FileTransformation", StringComparison.Ordinal) == true);
        var pluginType = assembly?.GetType("Jellyfin.Plugin.FileTransformation.FileTransformationPlugin");
        var serviceType = assembly?.GetType("Jellyfin.Plugin.FileTransformation.Library.IWebFileTransformationWriteService");
        var delegateType = assembly?.GetType("Jellyfin.Plugin.FileTransformation.Library.TransformFile");
        var instance = pluginType?.GetProperty("Instance", BindingFlags.Public | BindingFlags.Static)?.GetValue(null);
        var provider = instance?.GetType().GetProperty("ServiceProvider")?.GetValue(instance) as IServiceProvider;
        var service = serviceType is null ? null : provider?.GetService(serviceType);
        var update = serviceType?.GetMethod("UpdateTransformation");
        var transform = typeof(WebInjection).GetMethod(nameof(WebInjection.TransformIndex));
        if (service is null || update is null || delegateType is null || transform is null)
        {
            _logger.LogWarning("File Transformation was not found; JellySpotlight cannot be injected.");
            return Task.CompletedTask;
        }

        update.Invoke(service, [TransformationId, "index.html", Delegate.CreateDelegate(delegateType, transform)]);
        progress.Report(100);
        return Task.CompletedTask;
    }

    public IEnumerable<TaskTriggerInfo> GetDefaultTriggers() =>
    [
        new TaskTriggerInfo { Type = TaskTriggerInfoType.StartupTrigger }
    ];
}
