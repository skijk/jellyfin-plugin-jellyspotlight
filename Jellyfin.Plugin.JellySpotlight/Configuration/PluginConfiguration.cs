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
    public List<SpotlightRowConfiguration> Rows { get; set; } =
    [
        new() { Source = "hot", Title = "Trending this week" },
        new() { Source = "newPopular", Title = "Popular new arrivals" },
        new() { Enabled = false, Source = "recent", Title = "Recently added" }
    ];
    public string Source { get; set; } = "hot";
    public string Title { get; set; } = "Trending this week";
    public string Density { get; set; } = "feature";
    public string Position { get; set; } = "afterBulletin";
    public int ItemCount { get; set; } = 8;
    public bool ShowMetrics { get; set; } = true;
}
