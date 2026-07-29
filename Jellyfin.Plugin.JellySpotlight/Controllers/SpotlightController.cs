using Jellyfin.Plugin.JellySpotlight.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.Plugin.JellySpotlight.Controllers;

public sealed class SpotlightSettingsRequest
{
    public bool Enabled { get; set; } = true;
    public List<SpotlightRowConfiguration> Rows { get; set; } = [];
    public string Density { get; set; } = "feature";
    public string Position { get; set; } = "afterBulletin";
    public int ItemCount { get; set; } = 8;
    public bool ShowMetrics { get; set; } = true;
}

[ApiController]
[Route("JellySpotlight")]
public sealed class SpotlightController : ControllerBase
{
    [HttpGet("Settings")]
    [Authorize]
    public ActionResult<PluginConfiguration> Settings() => Ok(Plugin.Instance.Configuration);

    [HttpPut("Settings")]
    [Authorize(Policy = "RequiresElevation")]
    public IActionResult SaveSettings([FromBody] SpotlightSettingsRequest request)
    {
        var configuration = Plugin.Instance.Configuration;
        configuration.Enabled = request.Enabled;
        configuration.Rows = request.Rows.Count > 0
            ? request.Rows.Take(3).ToList()
            : configuration.Rows;
        configuration.Density = request.Density is "feature" or "cinematic"
            ? request.Density
            : "feature";
        configuration.Position = request.Position is "beforeBulletin" or "afterBulletin"
            ? request.Position
            : "afterBulletin";
        configuration.ItemCount = Math.Clamp(request.ItemCount, 6, 16);
        configuration.ShowMetrics = request.ShowMetrics;
        Plugin.Instance.UpdateConfiguration(configuration);
        return NoContent();
    }

    [HttpGet("Client.js")]
    [AllowAnonymous]
    public IActionResult Script() => Embedded("Web.spotlight.js", "text/javascript; charset=utf-8");

    [HttpGet("Client.css")]
    [AllowAnonymous]
    public IActionResult Styles() => Embedded("Web.spotlight.css", "text/css; charset=utf-8");

    private FileStreamResult Embedded(string suffix, string contentType)
    {
        var name = $"{typeof(Plugin).Namespace}.{suffix}";
        return File(typeof(Plugin).Assembly.GetManifestResourceStream(name)
            ?? throw new InvalidOperationException($"Missing resource {name}."), contentType);
    }
}
