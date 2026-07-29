# JellySpotlight

A compact, configurable, multi-title spotlight shelf for Jellyfin Web.

## Sources

- What's hot right now — reuses Jelana's hourly cached analytics.
- New and popular — combines Jelana data with Jellyfin item metadata.
- Recently added — uses Jellyfin's authenticated library API.

JellySpotlight never reads the Playback Reporting database. Analytics sources use the existing authenticated `/Jelana/Snapshot` cache endpoint.

## Requirements

- Jellyfin 10.11.x
- File Transformation
- Jelana for analytics-based sources

All user-facing text and source comments are English.
