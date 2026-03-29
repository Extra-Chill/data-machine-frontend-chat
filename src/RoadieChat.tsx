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
 * @package DataMachineFrontendChat
 * @since 0.3.0
 */
import { createElement, useState, useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import {
	Chat,
	DiffCard,
	useClientContextMetadata,
	parseCanonicalDiffFromToolGroup,
} from '@extrachill/chat';
import type { ToolGroup, DiffData, FetchFn } from '@extrachill/chat';
import type { UseChatReturn } from '@extrachill/chat';
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
	return parseCanonicalDiffFromToolGroup( group );
}

function resolveDiff( diffId: string, decision: 'accepted' | 'rejected' ): void {
	apiFetch( {
		path: '/datamachine/v1/diff/resolve',
		method: 'POST',
		data: { diff_id: diffId, decision },
	} ).catch( ( err: unknown ) => {
		// eslint-disable-next-line no-console
		console.error( 'Roadie: failed to resolve diff', diffId, err );
	} );
}

const roadieFetch: FetchFn = ( options ) =>
	apiFetch( {
		path: options.path,
		method: options.method,
		data: options.data,
		headers: options.headers,
	} );

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

function getSessionLabel( chat: UseChatReturn ): string {
	if ( ! chat.sessionId ) {
		return 'New chat';
	}

	const activeSession = chat.sessions.find( ( session ) => session.id === chat.sessionId );
	if ( activeSession?.title ) {
		return activeSession.title;
	}

	return `Session ${ chat.sessionId.slice( 0, 8 ) }`;
}

function renderRoadieHeaderControls( chat: UseChatReturn ): ReactNode {
	return createElement(
		'div',
		{ className: 'datamachine-chat__chatbar' },
		createElement(
			'div',
			{ className: 'datamachine-chat__session-summary' },
			createElement( 'span', { className: 'datamachine-chat__session-label' }, getSessionLabel( chat ) ),
			createElement( 'span', { className: 'datamachine-chat__session-count' }, `${ chat.sessions.length } saved` )
		),
		createElement(
			'div',
			{ className: 'datamachine-chat__session-actions' },
			createElement(
				'button',
				{
					type: 'button',
					className: 'datamachine-chat__session-button',
					onClick: () => chat.refreshSessions(),
					disabled: chat.sessionsLoading,
				},
				chat.sessionsLoading ? 'Refreshing…' : 'Refresh'
			),
			createElement(
				'button',
				{
					type: 'button',
					className: 'datamachine-chat__session-button datamachine-chat__session-button--new',
					onClick: () => chat.newSession(),
				},
				'New'
			)
		)
	);
}

export default function RoadieChat( {
	agentId,
	basePath,
	agentName,
	agentDescription,
}: RoadieChatProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const metadata = useClientContextMetadata();
	const open = useCallback( () => setIsOpen( true ), [] );
	const close = useCallback( () => setIsOpen( false ), [] );

	const toolRenderers = useMemo(
		() => ( {
			edit_post_blocks: renderDiffCard,
			replace_post_blocks: renderDiffCard,
			insert_content: renderDiffCard,
		} ),
		[]
	);

	return createElement(
		'div',
		{ className: 'datamachine-chat' },
		! isOpen &&
			createElement(
				'button',
				{
					type: 'button',
					className: 'datamachine-chat__fab',
					onClick: open,
					'aria-label': __( `Open ${ agentName } chat`, 'data-machine-frontend-chat' ),
				},
				agentName
			),
		createElement(
			'div',
			{
				className: `datamachine-chat__drawer${ isOpen ? ' is-open' : '' }`,
				'aria-hidden': ! isOpen,
			},
			createElement(
				'div',
				{ className: 'datamachine-chat__header' },
				createElement(
					'span',
					{ className: 'datamachine-chat__title' },
					agentName
				),
				createElement(
					'button',
					{
						type: 'button',
						className: 'datamachine-chat__close',
						onClick: close,
						'aria-label': __( 'Close', 'data-machine-frontend-chat' ),
					},
					'✕'
				)
			),
			createElement(
				'div',
				{ className: 'datamachine-chat__body' },
				createElement( Chat, {
					basePath,
					fetchFn: roadieFetch,
					agentId,
					showTools: true,
					showSessions: true,
					sessionUi: 'list',
					toolRenderers,
					renderHeader: renderRoadieHeaderControls,
					placeholder: __( `Ask ${ agentName } anything…`, 'data-machine-frontend-chat' ),
					metadata,
					emptyState: createElement(
						'div',
						{ className: 'datamachine-chat__empty' },
						createElement( 'h3', null, agentName ),
						createElement( 'p', null, agentDescription )
					),
				loadingMessages: true,
				processingLabel: ( turnCount: number ) =>
					__( `Working… (turn ${ turnCount })`, 'data-machine-frontend-chat' ),
				} )
			)
		)
	);
}
