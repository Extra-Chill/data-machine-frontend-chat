# Data Machine Frontend Chat

Floating agent chat widget for WordPress. Connects to [Data Machine](https://github.com/Extra-Chill/data-machine)'s agent system to provide a configurable AI assistant on any site.

## How it works

A small React app mounts a floating action button (FAB) in the bottom-right corner of every page. Click it and a slide-in drawer opens with a full chat interface powered by the [`@extrachill/chat`](https://www.npmjs.com/package/@extrachill/chat) package.

The chat connects to a Data Machine agent — which agent, who can see it, and what it says are all configurable per site. This plugin is a pure frontend shell with no business logic or tools. Tools are registered by other plugins via the `datamachine_tools` filter and Data Machine picks them up automatically.

## Configuration

Each site configures the chat widget via the `data_machine_frontend_chat_config` option:

```php
update_option( 'data_machine_frontend_chat_config', [
    'agent_slug'  => 'my-agent',
    'visibility'  => 'team',
    'description' => 'Your AI assistant.',
    'enabled'     => true,
] );
```

| Key | Type | Description |
|-----|------|-------------|
| `agent_slug` | `string` | Slug of the Data Machine agent to connect to |
| `visibility` | `string` | Who sees the chat: `team`, `logged_in`, or `public` |
| `description` | `string` | Shown in the empty state before the first message |
| `enabled` | `bool` | Toggle the chat on/off for this site |

The config can also be overridden entirely via the `data_machine_frontend_chat_config` filter.

Team visibility is controlled by the `data_machine_frontend_chat_is_team_member` filter (defaults to `manage_options`).

## Requirements

- WordPress 6.9+
- [Data Machine](https://github.com/Extra-Chill/data-machine) plugin (provides the agent backend)
- A configured Data Machine agent

## Architecture

```
Browser                          Server
-------                          ------
FAB -> Drawer -> <Chat>    -->   /datamachine/v1/chat
       (React)                   ChatOrchestrator
       @extrachill/chat          -> Agent memory
                                 -> Tool calling
                                 -> Multi-turn conversation
```

- **Frontend**: `@extrachill/chat` package, mounted via `wp_footer` hook
- **Backend**: Data Machine chat REST API with agent resolution by slug
- **Auth**: WordPress nonce authentication via `wp-api-fetch`
- **Agent resolution**: Looked up by slug from the network-scoped `datamachine_agents` table — no hardcoded IDs

## Features

- Slide-in drawer with CSS transition
- Chat stays mounted when drawer closes (preserves session state)
- Admin bar aware (offsets below the WP toolbar)
- Per-site agent configuration
- Visibility controls (team only, logged in, or public)
- CSS variable theming with fallback values for standalone use
- DiffCard rendering for inline code diffs
- Mobile responsive (full-width drawer on small screens)
- Network-activated (one plugin, all sites)

## CSS

Class prefix: `datamachine-chat`. Theme tokens use `--datamachine-*` variables with fallback values so the widget works on any Data Machine site without requiring the Extra Chill theme.

## Development

```bash
npm install
npm run build    # wp-scripts, outputs to build/
```

No custom webpack config — standard `wp-scripts` auto-discovery from `src/index.ts`.

## License

GPL v2 or later
