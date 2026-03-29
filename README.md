# Extra Chill Roadie

Floating agent chat for WordPress. Connects to [Data Machine](https://github.com/Extra-Chill/data-machine)'s agent system to provide an AI assistant on any site in the network.

## How it works

Roadie is a small React app that mounts a floating action button (FAB) in the bottom-right corner of every page. Click it and a slide-in drawer opens with a full chat interface powered by the [`@extrachill/chat`](https://www.npmjs.com/package/@extrachill/chat) package.

The chat connects to a Data Machine agent — which agent, who can see it, and what it says are all configurable per site.

## Configuration

Each site in the network configures Roadie via the `data_machine_frontend_chat_config` option:

```php
update_option( 'data_machine_frontend_chat_config', [
    'agent_slug'  => 'roadie',
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

## Requirements

- WordPress 6.9+
- [Data Machine](https://github.com/Extra-Chill/data-machine) plugin (provides the agent backend)
- A configured Data Machine agent

## Architecture

```
Browser                          Server
───────                          ──────
FAB → Drawer → <Chat>    ──→    /datamachine/v1/chat
      (React)                    ChatOrchestrator
      @extrachill/chat           → Agent memory
                                 → Tool calling
                                 → Multi-turn conversation
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
- CSS variable theming via Extra Chill design tokens
- Mobile responsive (full-width drawer on small screens)
- Network-activated (one plugin, all sites)

## Development

```bash
npm install
npm run build    # wp-scripts, outputs to build/
```

No custom webpack config — standard `wp-scripts` auto-discovery from `src/index.ts`.

## License

GPL v2 or later
