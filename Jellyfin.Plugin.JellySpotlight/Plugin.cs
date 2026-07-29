using System.Globalization;
using Jellyfin.Plugin.JellySpotlight.Configuration;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;

namespace Jellyfin.Plugin.JellySpotlight;

public sealed class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
{
    public Plugin(IApplicationPaths paths, IXmlSerializer serializer) : base(paths, serializer) => Instance = this;
    public static Plugin Instance { get; private set; } = null!;
    public override string Name => "JellySpotlight";
    public override string Description => "A compact, configurable multi-title spotlight shelf for Jellyfin.";
    public override Guid Id => Guid.Parse("f41f333d-4be5-41df-9b23-d6b5c768ac63");

    public IEnumerable<PluginPageInfo> GetPages() =>
    [
        new PluginPageInfo
        {
            Name = Name,
            DisplayName = "Spotlight",
            EnableInMainMenu = true,
            MenuIcon = "view_carousel",
            EmbeddedResourcePath = string.Format(
                CultureInfo.InvariantCulture,
                "{0}.Configuration.configPage.html",
                GetType().Namespace)
        }
    ];
}
