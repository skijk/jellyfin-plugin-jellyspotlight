using System.Text;
using System.Text.RegularExpressions;

namespace Jellyfin.Plugin.JellySpotlight.Services;

public static partial class WebInjection
{
    public static async Task TransformIndex(string path, Stream stream)
    {
        ArgumentNullException.ThrowIfNull(stream);
        stream.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(stream, Encoding.UTF8, true, leaveOpen: true);
        var source = await reader.ReadToEndAsync().ConfigureAwait(false);
        if (source.Contains("data-jellyspotlight", StringComparison.Ordinal))
        {
            stream.Seek(0, SeekOrigin.Begin);
            return;
        }

        const string assets = """
            <link data-jellyspotlight rel="stylesheet" href="/JellySpotlight/Client.css?v=0.2.7.0">
            <script data-jellyspotlight defer src="/JellySpotlight/Client.js?v=0.2.7.0"></script>
            """;
        var bytes = Encoding.UTF8.GetBytes(HeadEndRegex().Replace(source, $"{assets}</head>", 1));
        stream.SetLength(0);
        stream.Seek(0, SeekOrigin.Begin);
        await stream.WriteAsync(bytes).ConfigureAwait(false);
        stream.Seek(0, SeekOrigin.Begin);
    }

    [GeneratedRegex("</head>", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex HeadEndRegex();
}
