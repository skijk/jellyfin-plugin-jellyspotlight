# JellySpotlight

A configurable collection of wide, horizontally scrollable feature rows for Jellyfin Web.

## Sources

- Trending this week — titles growing fastest during the last 7 days compared with the previous 7 days.
- Popular new arrivals — recently added titles, with titles already being watched shown first.
- Recently added — the latest movies and series added to the Jellyfin library.

JellySpotlight never reads the Playback Reporting database. Analytics sources use the existing authenticated `/Jelana/Snapshot` cache endpoint.

## Requirements

- Jellyfin 10.11.x
- File Transformation
- Jelana for analytics-based sources

All user-facing text and source comments are English.
