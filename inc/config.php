<?php
/**
 * Roadie configuration — per-site agent settings.
 *
 * Each site in the network can configure which Data Machine agent powers
 * its floating chat, who can see it, and what the default description says.
 *
 * Configuration is stored in the site option `extrachill_roadie_config` and
 * can be overridden entirely via the `extrachill_roadie_config` filter.
 *
 * @package ExtraChillRoadie
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
function extrachill_roadie_get_config(): array {
	$defaults = array(
		'agent_slug'  => '',
		'visibility'  => 'team',
		'description' => __( 'Your AI assistant for the Extra Chill platform.', 'extrachill-roadie' ),
		'enabled'     => false,
	);

	$saved = get_option( 'extrachill_roadie_config', array() );
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
	return apply_filters( 'extrachill_roadie_config', $config );
}

/**
 * Check whether the current user can see the Roadie chat.
 *
 * @param array $config Roadie config (from extrachill_roadie_get_config).
 * @return bool
 */
function extrachill_roadie_user_can_see( array $config ): bool {
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
			if ( function_exists( 'ec_is_team_member' ) ) {
				return ec_is_team_member();
			}
			// Fallback: require manage_options if ec_is_team_member isn't available.
			return current_user_can( 'manage_options' );
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
function extrachill_roadie_resolve_agent( string $slug ): ?array {
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
