<?php
/**
 * Roadie configuration — per-site agent settings.
 *
 * Each site in the network can configure which Data Machine agent powers
 * its floating chat, who can see it, and what the default description says.
 *
 * Configuration is stored in the site option `data_machine_frontend_chat_config` and
 * can be overridden entirely via the `data_machine_frontend_chat_config` filter.
 *
 * @package DataMachineFrontendChat
 * @since 0.1.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Get the Roadie configuration for the current site.
 *
 * @return array{
 *   agent_slug: string,
 *   visibility: 'team'|'logged_in'|'public',
 *   description: string,
 *   enabled: bool,
 * }
 */
function data_machine_frontend_chat_get_config(): array {
	$defaults = array(
		'agent_slug'  => '',
		'visibility'  => 'team',
		'description' => __( 'Your AI assistant.', 'data-machine-frontend-chat' ),
		'enabled'     => false,
	);

	$saved = get_option( 'data_machine_frontend_chat_config', array() );
	$config = wp_parse_args( $saved, $defaults );

	/**
	 * Filter the Roadie config for the current site.
	 *
	 * Allows plugins or themes to override any setting. Return an empty
	 * agent_slug or enabled=false to disable the chat on this site.
	 *
	 * @since 0.1.0
	 *
	 * @param array $config Current configuration.
	 */
	return apply_filters( 'data_machine_frontend_chat_config', $config );
}

/**
 * Check whether the current user can see the Roadie chat.
 *
 * @param array $config Roadie config (from data_machine_frontend_chat_get_config).
 * @return bool
 */
function data_machine_frontend_chat_user_can_see( array $config ): bool {
	$visibility = $config['visibility'] ?? 'team';

	switch ( $visibility ) {
		case 'public':
			return true;

		case 'logged_in':
			return is_user_logged_in();

		case 'team':
		default:
			if ( ! is_user_logged_in() ) {
				return false;
			}
			/**
			 * Filter whether the current user is considered a "team" member
			 * for the purpose of showing the chat widget.
			 *
			 * Defaults to `manage_options` capability check. Consuming plugins
			 * can hook this to use their own team-membership logic.
			 *
			 * @since 0.4.0
			 *
			 * @param bool $is_team Whether the current user is a team member.
			 */
			return apply_filters(
				'data_machine_frontend_chat_is_team_member',
				current_user_can( 'manage_options' )
			);
	}
}

/**
 * Resolve the agent from the Data Machine agents table by slug.
 *
 * Uses a static cache so repeated calls within the same request are free.
 * Returns null if Data Machine is not active or the agent doesn't exist.
 *
 * @param string $slug Agent slug to resolve.
 * @return array|null Agent row (agent_id, agent_slug, agent_name, …) or null.
 */
function data_machine_frontend_chat_resolve_agent( string $slug ): ?array {
	static $cache = array();

	if ( isset( $cache[ $slug ] ) ) {
		return $cache[ $slug ];
	}

	// Data Machine must be active.
	if ( ! class_exists( '\DataMachine\Core\Database\Agents\Agents' ) ) {
		$cache[ $slug ] = null;
		return null;
	}

	$repo = new \DataMachine\Core\Database\Agents\Agents();
	$agent = $repo->get_by_slug( $slug );

	$cache[ $slug ] = $agent;
	return $agent;
}
