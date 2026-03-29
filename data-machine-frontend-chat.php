<?php
/**
 * Plugin Name: Data Machine Frontend Chat
 * Plugin URI: https://github.com/nicholashuber/data-machine-frontend-chat
 * Description: Floating agent chat widget for Data Machine. Provides a configurable AI assistant on any WordPress site powered by Data Machine.
 * Version: 0.4.0
 * Author: Chris Huber
 * Author URI: https://chubes.net
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: data-machine-frontend-chat
 * Requires at least: 6.9
 * Tested up to: 6.9
 * Requires PHP: 7.4
 *
 * @package DataMachineFrontendChat
 * @since 0.1.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'DATA_MACHINE_FRONTEND_CHAT_VERSION', '0.4.0' );
define( 'DATA_MACHINE_FRONTEND_CHAT_PLUGIN_FILE', __FILE__ );
define( 'DATA_MACHINE_FRONTEND_CHAT_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'DATA_MACHINE_FRONTEND_CHAT_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once DATA_MACHINE_FRONTEND_CHAT_PLUGIN_DIR . 'inc/config.php';
require_once DATA_MACHINE_FRONTEND_CHAT_PLUGIN_DIR . 'inc/enqueue.php';
