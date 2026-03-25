/**
 * Roadie — Floating chat entry point.
 *
 * Standalone script enqueued on all studio.extrachill.com pages for
 * authenticated team members. Completely independent of the Studio block.
 *
 * @package ExtraChillStudio
 * @since 0.3.0
 */
import '@extrachill/chat/css';
import './roadie.css';
import { createElement } from '@wordpress/element';
import { createRoot, render } from '@wordpress/element';
import type { ReactElement } from 'react';
import RoadieChat from './RoadieChat';

declare global {
	interface Window {
		ecRoadieConfig?: {
			agentId: number;
			basePath: string;
			agentName: string;
			agentDescription: string;
		};
	}
}

const MOUNT_SELECTOR = '[data-ec-roadie-chat]';

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

	const config = window.ecRoadieConfig;
	if ( ! config?.agentId ) {
		return;
	}

	el.dataset.ecMounted = 'true';
	mount(
		el,
		createElement( RoadieChat, {
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
