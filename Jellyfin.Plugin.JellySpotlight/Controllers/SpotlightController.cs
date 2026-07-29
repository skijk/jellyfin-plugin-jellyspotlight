using Jellyfin.Plugin.JellySpotlight.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin.Plugin.JellySpotlight.Controllers;

[ApiController]
[Route("JellySpotlight")]
public sealed class SpotlightController : ControllerBase
{
    [HttpGet("Settings")]
    [Authorize]
    public ActionResult<PluginConfiguration> Settings() => Ok(Plugin.Instance.Configuration);

    [HttpPut("Settings")]
    [Authorize(Policy = "RequiresElevation")]
    public IActionResult SaveSettings([FromBody] PluginConfiguration configuration)
    {
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
