<?php
/**
 * Roadie script and style enqueue + mount container.
 *
 * @package ExtraChillRoadie
 * @since 0.1.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enqueue the Roadie chat script and styles.
 *
 * Fires on wp_enqueue_scripts so the assets load on every frontend page.
 * Bails early if the chat is disabled, the user can't see it, or the
 * agent doesn't exist.
 *
 * @return void
 */
function extrachill_roadie_enqueue() {
	$config = extrachill_roadie_get_config();

	if ( empty( $config['enabled'] ) || empty( $config['agent_slug'] ) ) {
		return;
	}

	if ( ! extrachill_roadie_user_can_see( $config ) ) {
		return;
	}

	$agent = extrachill_roadie_resolve_agent( $config['agent_slug'] );
	if ( ! $agent ) {
		return;
	}

	$build_dir = EXTRACHILL_ROADIE_PLUGIN_DIR . 'build/';
	$build_url = EXTRACHILL_ROADIE_PLUGIN_URL . 'build/';
	$asset_php = $build_dir . 'index.asset.php';

	if ( ! file_exists( $asset_php ) ) {
		return;
	}

	$asset = require $asset_php;

	wp_enqueue_script(
		'extrachill-roadie',
		$build_url . 'index.js',
		$asset['dependencies'] ?? array(),
		$asset['version'] ?? EXTRACHILL_ROADIE_VERSION,
		array( 'in_footer' => true )
	);

	if ( file_exists( $build_dir . 'index.css' ) ) {
		wp_enqueue_style(
			'extrachill-roadie',
			$build_url . 'index.css',
			array(),
			$asset['version'] ?? EXTRACHILL_ROADIE_VERSION
		);
	}

	wp_localize_script(
		'extrachill-roadie',
		'ecRoadieConfig',
		array(
			'agentId'          => (int) $agent['agent_id'],
			'basePath'         => '/datamachine/v1/chat',
			'agentName'        => (string) $agent['agent_name'],
			'agentDescription' => (string) $config['description'],
		)
	);
}
add_action( 'wp_enqueue_scripts', 'extrachill_roadie_enqueue' );

/**
 * Render the Roadie chat mount container in wp_footer.
 *
 * Only renders if the script was successfully enqueued.
 *
 * @return void
 */
function extrachill_roadie_render_container() {
	if ( ! wp_script_is( 'extrachill-roadie', 'enqueued' ) ) {
		return;
	}

	echo '<div data-ec-roadie-chat></div>';
}
add_action( 'wp_footer', 'extrachill_roadie_render_container', 50 );
