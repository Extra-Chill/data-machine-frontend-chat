/**
 * RoadieChat — Floating agent chat panel with diff visualization.
 *
 * FAB button at bottom-right → slide-in drawer from the right.
 * The Chat component stays mounted when the drawer closes so session
 * state, messages, and scroll position survive open/close cycles.
 *
 * When AI uses content-editing tools (edit_post_blocks, replace_post_blocks)
 * with preview mode, the tool result is rendered as a DiffCard with
 * Accept/Reject buttons instead of raw JSON.
 *
 * @package ExtraChillRoadie
 * @since 0.3.0
 */
import { createElement, useState, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Chat, DiffCard } from '@extrachill/chat';
import type { ToolGroup, DiffData } from '@extrachill/chat';
import type { ReactNode } from 'react';

interface RoadieChatProps {
	agentId: number;
	basePath: string;
	agentName: string;
	agentDescription: string;
}

/**
 * Parse a tool result into DiffData for DiffCard rendering.
 *
 * Returns null if the tool result is not a preview diff (e.g. the tool
 * was called without preview=true, or the result is malformed).
 */
function parseDiffFromToolResult( group: ToolGroup ): DiffData | null {
	if ( ! group.resultMessage ) {
		return null;
	}

	try {
		const result = JSON.parse( group.resultMessage.content );
		const data = result.data ?? result;

		// Only render DiffCard for preview results.
		if ( ! data.preview || ! data.diff ) {
			return null;
		}

		return {
			diffId: data.diff.diffId ?? data.diff_id ?? '',
			diffType: data.diff.diffType ?? 'edit',
			originalContent: data.diff.originalContent ?? '',
			replacementContent: data.diff.replacementContent ?? '',
			summary: data.message,
		};
	} catch {
		return null;
	}
}

/**
 * Call the core resolve-diff endpoint.
 */
function resolveDiff(
	diffId: string,
	decision: 'accepted' | 'rejected'
): void {
	apiFetch( {
		path: '/datamachine/v1/diff/resolve',
		method: 'POST',
		data: { diff_id: diffId, decision },
	} ).catch( ( err: unknown ) => {
		// eslint-disable-next-line no-console
		console.error( 'Roadie: failed to resolve diff', diffId, err );
	} );
}

/**
 * Render a DiffCard for a content-editing tool result.
 *
 * Falls back to null (default ToolMessage rendering) when the tool
 * result is not a preview diff.
 */
function renderDiffCard( group: ToolGroup ): ReactNode {
	const diff = parseDiffFromToolResult( group );
	if ( ! diff ) {
		return null;
	}

	return createElement( DiffCard, {
		diff,
		onAccept: ( id: string ) => resolveDiff( id, 'accepted' ),
		onReject: ( id: string ) => resolveDiff( id, 'rejected' ),
	} );
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

	// Tool renderers — register DiffCard for content-editing tools.
	// Memoized so the Chat component doesn't re-render unnecessarily.
	const toolRenderers = useMemo(
		() => ( {
			edit_post_blocks: renderDiffCard,
			replace_post_blocks: renderDiffCard,
		} ),
		[]
	);

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
					toolRenderers,
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
