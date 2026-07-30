using MediaBrowser.Model.Plugins;

namespace Jellyfin.Plugin.JellySpotlight.Configuration;

public sealed class SpotlightRowConfiguration
{
    public bool Enabled { get; set; } = true;
    public string Source { get; set; } = "hot";
    public string Title { get; set; } = "Trending this week";
}

public sealed class PluginConfiguration : BasePluginConfiguration
{
    public bool Enabled { get; set; } = true;
    // Keep this collection empty before XML deserialization. XmlSerializer populates
    // existing collections, so prefilled defaults would be duplicated after restart.
    public List<SpotlightRowConfiguration> Rows { get; set; } = [];
    public string Source { get; set; } = "hot";
    public string Title { get; set; } = "Trending this week";
    public string Density { get; set; } = "feature";
    public string Position { get; set; } = "afterBulletin";
    public int ItemCount { get; set; } = 8;
    public bool ShowMetrics { get; set; } = true;
}
