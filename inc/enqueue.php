<?php
/**
 * Script and style enqueue + mount container.
 *
 * @package DataMachineFrontendChat
 * @since 0.4.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Enqueue the frontend chat script and styles.
 *
 * Fires on wp_enqueue_scripts so the assets load on every frontend page.
 * Bails early if the chat is disabled, the user can't access the agent,
 * or the agent doesn't exist.
 *
 * @return void
 */
function data_machine_frontend_chat_enqueue() {
	$config = data_machine_frontend_chat_get_config();

	if ( empty( $config['enabled'] ) || empty( $config['agent_slug'] ) ) {
		return;
	}

	$agent = data_machine_frontend_chat_resolve_agent( $config['agent_slug'] );
	if ( ! $agent ) {
		return;
	}

	if ( ! data_machine_frontend_chat_user_can_see( $agent ) ) {
		return;
	}

	$build_dir = DATA_MACHINE_FRONTEND_CHAT_PLUGIN_DIR . 'build/';
	$build_url = DATA_MACHINE_FRONTEND_CHAT_PLUGIN_URL . 'build/';
	$asset_php = $build_dir . 'index.asset.php';

	if ( ! file_exists( $asset_php ) ) {
		return;
	}

	$asset = require $asset_php;

	wp_enqueue_script(
		'data-machine-frontend-chat',
		$build_url . 'index.js',
		$asset['dependencies'] ?? array(),
		$asset['version'] ?? DATA_MACHINE_FRONTEND_CHAT_VERSION,
		array( 'in_footer' => true )
	);

	if ( file_exists( $build_dir . 'index.css' ) ) {
		wp_enqueue_style(
			'data-machine-frontend-chat',
			$build_url . 'index.css',
			array(),
			$asset['version'] ?? DATA_MACHINE_FRONTEND_CHAT_VERSION
		);
	}

	$js_config = array(
		'agentId'          => (int) $agent['agent_id'],
		'basePath'         => '/datamachine/v1/chat',
		'agentName'        => (string) $agent['agent_name'],
		'agentDescription' => (string) $config['description'],
	);

	if ( ! empty( $config['loading_messages'] ) ) {
		$js_config['loadingMessages'] = $config['loading_messages'];
	}

	wp_localize_script(
		'data-machine-frontend-chat',
		'datamachineChatConfig',
		$js_config
	);
}
add_action( 'wp_enqueue_scripts', 'data_machine_frontend_chat_enqueue' );

/**
 * Render the chat mount container in wp_footer.
 *
 * Only renders if the script was successfully enqueued.
 *
 * @return void
 */
function data_machine_frontend_chat_render_container() {
	if ( ! wp_script_is( 'data-machine-frontend-chat', 'enqueued' ) ) {
		return;
	}

	echo '<div data-datamachine-chat></div>';
}
add_action( 'wp_footer', 'data_machine_frontend_chat_render_container', 50 );
