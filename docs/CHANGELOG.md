# Changelog

## [0.4.2] - 2026-03-29

### Changed
- update @extrachill/chat to ^0.8.0

## [0.4.1] - 2026-03-29

### Changed
- remove visibility system, defer to DM's can_access_agent

## [0.4.0] - 2026-03-29

### Added
- enable cycling loading messages in Roadie chat

### Changed
- rename to data-machine-frontend-chat (generic DM widget)

### Fixed
- PHPCS alignment warnings in config.php
- remove Network: true — per-site activation only

## [0.3.0] - 2026-03-26

### Added
- render canonical preview diffs in Roadie

### Changed
- use shared chat client context metadata

### Fixed
- keep Roadie non-modal during page collaboration

## [0.2.0] - 2026-03-25

### Added
- wire DiffCard for content-editing tool previews

### Changed
- add README
- initial release: floating agent chat for the Extra Chill network

### Fixed
- offset drawer and backdrop for WordPress admin bar

## [0.1.0] - 2026-03-25

### Added
- Initial release: floating agent chat widget for the Extra Chill network
- Per-site configuration via `data_machine_frontend_chat_config` option and filter
- Agent resolved by slug from Data Machine agents table
- Visibility modes: team, logged_in, public
- Slide-in drawer with persistent chat state across open/close
- CSS variable theming via @extrachill/chat token mapping
