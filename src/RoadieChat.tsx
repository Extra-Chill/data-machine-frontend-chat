/**
 * RoadieChat — Floating agent chat panel.
 *
 * FAB button at bottom-right → slide-in drawer from the right.
 * The Chat component stays mounted when the drawer closes so session
 * state, messages, and scroll position survive open/close cycles.
 *
 * @package ExtraChillStudio
 * @since 0.3.0
 */
import { createElement, useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Chat } from '@extrachill/chat';

interface RoadieChatProps {
	agentId: number;
	basePath: string;
	agentName: string;
	agentDescription: string;
}

export default function RoadieChat( {
	agentId,
	basePath,
	agentName,
	agentDescription,
}: RoadieChatProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const open = useCallback( () => setIsOpen( true ), [] );
	const close = useCallback( () => setIsOpen( false ), [] );

	return createElement(
		'div',
		{ className: 'ec-roadie' },

		// FAB — hidden when drawer is open.
		! isOpen &&
			createElement(
				'button',
				{
					type: 'button',
					className: 'ec-roadie__fab',
					onClick: open,
					'aria-label': __( `Open ${ agentName } chat`, 'extrachill-studio' ),
				},
				agentName
			),

		// Backdrop — only rendered when open for click-to-close.
		createElement( 'div', {
			className: `ec-roadie__backdrop${ isOpen ? ' is-open' : '' }`,
			onClick: close,
			'aria-hidden': 'true',
		} ),

		// Drawer — always in DOM, toggled via CSS class for slide animation.
		// The Chat component inside stays mounted across open/close.
		createElement(
			'div',
			{
				className: `ec-roadie__drawer${ isOpen ? ' is-open' : '' }`,
				'aria-hidden': ! isOpen,
			},

			// Header
			createElement(
				'div',
				{ className: 'ec-roadie__header' },
				createElement(
					'span',
					{ className: 'ec-roadie__title' },
					agentName
				),
				createElement(
					'button',
					{
						type: 'button',
						className: 'ec-roadie__close',
						onClick: close,
						'aria-label': __( 'Close', 'extrachill-studio' ),
					},
					'\u2715'
				)
			),

			// Chat body — always mounted.
			createElement(
				'div',
				{ className: 'ec-roadie__body' },
				createElement( Chat, {
					basePath,
					fetchFn: apiFetch,
					agentId,
					showTools: true,
					showSessions: true,
					placeholder: __( `Ask ${ agentName } anything\u2026`, 'extrachill-studio' ),
					metadata: {
						client_context: {
							site: window.location.hostname,
						},
					},
					emptyState: createElement(
						'div',
						{ className: 'ec-roadie__empty' },
						createElement( 'h3', null, agentName ),
						createElement( 'p', null, agentDescription )
					),
					processingLabel: ( turnCount: number ) =>
						__( `Working\u2026 (turn ${ turnCount })`, 'extrachill-studio' ),
				} )
			)
		)
	);
}
