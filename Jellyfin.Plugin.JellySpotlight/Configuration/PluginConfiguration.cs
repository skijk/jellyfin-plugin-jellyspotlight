using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.JellySpotlight.Configuration;

public sealed class PluginConfiguration : BasePluginConfiguration
{
    public bool Enabled { get; set; } = true;
    public string Source { get; set; } = "hot";
    public string Title { get; set; } = "What's hot right now";
    public string Density { get; set; } = "compact";
    public int ItemCount { get; set; } = 8;
    public bool ShowMetrics { get; set; } = true;
}
