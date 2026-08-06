# JellySpotlight

A configurable collection of wide, horizontally scrollable feature rows for Jellyfin Web.

<img width="1700" height="569" alt="image" src="https://github.com/user-attachments/assets/009a7518-db63-491d-8f2a-ef88a083555e" />


## Sources

- Trending this week — titles ranked primarily by unique viewers during the
  last 7 days. At least two viewers are required; active days and growth over
  the previous week break ties, and episode binges are capped.
- Popular new arrivals — recently added titles, with titles already being watched shown first.
- Recently added — the latest movies and series added to the Jellyfin library.
- Coming soon — monitored and unavailable Radarr movies with a confirmed future
  digital release date, combined with monitored Sonarr seasons whose first
  regular episode has a confirmed future air date. Specials and later episodes
  are not shown.

JellySpotlight never reads the Playback Reporting database. Analytics sources use the existing authenticated `/Jelana/Snapshot` cache endpoint.

## Dependencies

| Component | Status | Used for |
| --- | --- | --- |
| Jellyfin Server 10.11.11 | Required | Supported server and plugin ABI |
| [File Transformation](https://github.com/IAmParadox27/jellyfin-plugin-file-transformation) | Required | Injects Spotlight into Jellyfin Web |
| [Jelana](https://github.com/skijk/jellyfin-plugin-jelana) | Required by the plugin catalog | Supplies the hourly cached Trending and Popular new arrivals data |
| [Playback Reporting](https://github.com/jellyfin/jellyfin-plugin-playbackreporting) | Transitive through Jelana | Playback history used when Jelana builds its cache |
| [Arr Watch](https://github.com/skijk/jellyfin-plugin-arrwatch) | Optional | Supplies Coming soon movies, season premieres, dates and artwork from Radarr and Sonarr |
| [JellyBulletin](https://github.com/skijk/jellyfin-plugin-jellybulletin) | Optional | Spotlight can be positioned before or after Bulletin |

JellySpotlight isolates row failures. If an optional source is unavailable,
other configured rows continue to render. Coming soon is hidden when Arr Watch
is missing or has no confirmed future movie releases or season premieres.

## Installation

Install and restart after each required dependency before installing
JellySpotlight:

1. Add and install File Transformation:

   ```text
   https://www.iamparadox.dev/jellyfin/plugins/manifest.json
   ```

2. Add and install Playback Reporting from the official Jellyfin plugin
   catalog.
3. Add and install Jelana:

   ```text
   https://raw.githubusercontent.com/skijk/jellyfin-plugin-jelana-repository/main/manifest.json
   ```

4. Add and install JellySpotlight:

   ```text
   https://raw.githubusercontent.com/skijk/jellyfin-plugin-jellyspotlight-repository/main/manifest.json
   ```

5. Optionally install Arr Watch to enable Coming soon.
6. Restart Jellyfin and configure the rows under **Dashboard → Plugins →
   JellySpotlight**.

## Data and caching

Trending and Popular new arrivals reuse Jelana's atomically replaced hourly
snapshot and never query Playback Reporting live. Recently added uses the
authenticated Jellyfin library API. Coming soon uses Arr Watch's independent
server-side Radarr and Sonarr caches; API keys and internal addresses are never
exposed to the browser.

All user-facing text and source comments are English.
