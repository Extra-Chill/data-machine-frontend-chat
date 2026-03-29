<?php
/**
 * Configuration — per-site agent settings.
 *
 * Each site configures which Data Machine agent powers its floating chat.
 * Visibility is determined by Data Machine's agent access system:
 * PermissionHelper::can_access_agent(). No custom permission logic here.
 *
 * Configuration is stored in the site option `data_machine_frontend_chat_config`
 * and can be overridden via the `data_machine_frontend_chat_config` filter.
 *
 * @package DataMachineFrontendChat
 * @since 0.4.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Get the frontend chat configuration for the current site.
 *
 * @return array{
 *   agent_slug: string,
 *   description: string,
 *   enabled: bool,
 * }
 */
function data_machine_frontend_chat_get_config(): array {
	$defaults = array(
		'agent_slug'  => '',
		'description' => __( 'Your AI assistant.', 'data-machine-frontend-chat' ),
		'enabled'     => false,
	);

	$saved  = get_option( 'data_machine_frontend_chat_config', array() );
	$config = wp_parse_args( $saved, $defaults );

	/**
	 * Filter the frontend chat config for the current site.
	 *
	 * @since 0.4.0
	 *
	 * @param array $config Current configuration.
	 */
	return apply_filters( 'data_machine_frontend_chat_config', $config );
}

/**
 * Check whether the current user can see the chat widget.
 *
 * Defers entirely to Data Machine's agent access system. If DM's
 * PermissionHelper is available, uses can_access_agent(). Otherwise
 * falls back to manage_options capability.
 *
 * @param array $agent Resolved agent row from data_machine_frontend_chat_resolve_agent.
 * @return bool
 */
function data_machine_frontend_chat_user_can_see( array $agent ): bool {
	if ( ! is_user_logged_in() ) {
		return false;
	}

	$agent_id = (int) ( $agent['agent_id'] ?? 0 );
	if ( $agent_id <= 0 ) {
		return false;
	}

	if ( class_exists( '\DataMachine\Abilities\PermissionHelper' ) ) {
		return \DataMachine\Abilities\PermissionHelper::can_access_agent( $agent_id, 'viewer' );
	}

	// Fallback when Data Machine's PermissionHelper is not available.
	return current_user_can( 'manage_options' );
}

/**
 * Resolve the agent from the Data Machine agents table by slug.
 *
 * @param string $slug Agent slug to resolve.
 * @return array|null Agent row or null.
 */
function data_machine_frontend_chat_resolve_agent( string $slug ): ?array {
	static $cache = array();

	if ( isset( $cache[ $slug ] ) ) {
		return $cache[ $slug ];
	}

	if ( ! class_exists( '\DataMachine\Core\Database\Agents\Agents' ) ) {
		$cache[ $slug ] = null;
		return null;
	}

	$repo  = new \DataMachine\Core\Database\Agents\Agents();
	$agent = $repo->get_by_slug( $slug );

	$cache[ $slug ] = $agent;
	return $agent;
}
