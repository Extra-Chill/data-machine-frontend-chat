/**
 * Data Machine Frontend Chat — Entry point.
 *
 * Standalone script enqueued on frontend pages for eligible users.
 * Mounts a configurable Data Machine agent chat widget.
 *
 * @package DataMachineFrontendChat
 * @since 0.4.0
 */
import '@extrachill/chat/css';
import './agent-chat.css';
import { createElement } from '@wordpress/element';
import { createRoot, render } from '@wordpress/element';
import type { ReactElement } from 'react';
import AgentChat from './AgentChat';

declare global {
	interface Window {
		datamachineChatConfig?: {
			agentId: number;
			basePath: string;
			agentName: string;
			agentDescription: string;
		};
	}
}

const MOUNT_SELECTOR = '[data-datamachine-chat]';

function mount( container: HTMLElement, component: ReactElement ): void {
	if ( typeof createRoot === 'function' ) {
		createRoot( container ).render( component );
		return;
	}
	if ( typeof render === 'function' ) {
		render( component, container );
	}
}

function init(): void {
	const el = document.querySelector< HTMLElement >( MOUNT_SELECTOR );
	if ( ! el || el.dataset.ecMounted === 'true' ) {
		return;
	}

	const config = window.datamachineChatConfig;
	if ( ! config?.agentId ) {
		return;
	}

	el.dataset.ecMounted = 'true';
	mount(
		el,
		createElement( AgentChat, {
			agentId: config.agentId,
			basePath: config.basePath,
			agentName: config.agentName,
			agentDescription: config.agentDescription,
		} )
	);
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
