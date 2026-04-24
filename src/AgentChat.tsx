/**
 * AgentChat — Floating agent chat panel with diff visualization.
 *
 * FAB button at bottom-right → slide-in drawer from the right.
 * The Chat component stays mounted when the drawer closes so session
 * state, messages, and scroll position survive open/close cycles.
 *
 * When AI uses a pending-action tool (edit_post_blocks, replace_post_blocks,
 * insert_content) with preview mode, the tool result is rendered as a
 * DiffCard with Accept/Reject buttons instead of raw JSON. Accept/Reject
 * hit Data Machine's unified /actions/resolve endpoint.
 *
 * @package DataMachineFrontendChat
 * @since 0.3.0
 */
import { createElement, useState, useCallback, useMemo, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import {
	Chat,
	DiffCard,
	useClientContextMetadata,
	parseCanonicalDiffFromToolGroup,
} from '@extrachill/chat';
import type { ToolGroup, DiffData, FetchFn, MediaUploadFn } from '@extrachill/chat';
import type { ReactNode } from 'react';

interface AgentChatProps {
	agentId: number;
	basePath: string;
	agentName: string;
	agentDescription: string;
	loadingMessages?: boolean | {
		mode?: 'default' | 'extend' | 'override';
		messages?: string[];
		interval?: number;
	};
}

/**
 * Parse a tool result into DiffData for DiffCard rendering.
 *
 * Returns null if the tool result is not a preview action (e.g. the
 * tool was called without preview=true, or the result is malformed).
 */
function parseDiffFromToolResult( group: ToolGroup ): DiffData | null {
	return parseCanonicalDiffFromToolGroup( group );
}

/**
 * Resolve a pending action by id.
 *
 * Data Machine unified its preview primitive on a generic pending-action
 * model in PR #1171 (editor #5): the old /datamachine/v1/diff/resolve
 * endpoint and `diff_id` parameter were removed in favour of
 * /datamachine/v1/actions/resolve with `action_id`. The unified endpoint
 * handles every preview-capable tool kind, not just content diffs, so
 * this callback works uniformly for edit_post_blocks, replace_post_blocks,
 * insert_content, and any future kind a plugin registers on the
 * `datamachine_pending_action_handlers` filter.
 */
function resolvePendingAction( actionId: string, decision: 'accepted' | 'rejected' ): void {
	apiFetch( {
		path: '/datamachine/v1/actions/resolve',
		method: 'POST',
		data: { action_id: actionId, decision },
	} ).catch( ( err: unknown ) => {
		// eslint-disable-next-line no-console
		console.error( 'AgentChat: failed to resolve pending action', actionId, err );
	} );
}

const agentFetch: FetchFn = ( options ) =>
	apiFetch( {
		path: options.path,
		method: options.method,
		data: options.data,
		headers: options.headers,
	} );

/**
 * Upload a file to the WordPress Media Library.
 *
 * Uses the standard wp/v2/media endpoint via @wordpress/api-fetch,
 * which handles nonce auth automatically.
 */
const wpMediaUpload: MediaUploadFn = async ( file: File ) => {
	const formData = new FormData();
	formData.append( 'file', file );

	const media = await apiFetch( {
		path: '/wp/v2/media',
		method: 'POST',
		body: formData,
	} ) as { id: number; source_url: string };

	return {
		url: media.source_url,
		media_id: media.id,
	};
};

function renderDiffCard( group: ToolGroup ): ReactNode {
	const diff = parseDiffFromToolResult( group );
	if ( ! diff ) {
		return null;
	}

	return createElement( DiffCard, {
		diff,
		onAccept: ( actionId: string ) => resolvePendingAction( actionId, 'accepted' ),
		onReject: ( actionId: string ) => resolvePendingAction( actionId, 'rejected' ),
	} );
}

export default function AgentChat( {
	agentId,
	basePath,
	agentName,
	agentDescription,
	loadingMessages = true,
}: AgentChatProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ unreadCount, setUnreadCount ] = useState( 0 );
	const metadata = useClientContextMetadata();
	const open = useCallback( () => setIsOpen( true ), [] );
	const close = useCallback( () => setIsOpen( false ), [] );

	// Close drawer on Escape key.
	useEffect( () => {
		function handleKeyDown( e: KeyboardEvent ) {
			if ( e.key === 'Escape' && isOpen ) {
				setIsOpen( false );
			}
		}
		document.addEventListener( 'keydown', handleKeyDown );
		return () => document.removeEventListener( 'keydown', handleKeyDown );
	}, [ isOpen ] );

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
		createElement(
			'button',
			{
				type: 'button',
				className: `datamachine-chat__fab${ isOpen ? ' is-hidden' : '' }`,
				onClick: open,
				'aria-label': __( `Open ${ agentName } chat`, 'data-machine-frontend-chat' ),
			},
			agentName,
			unreadCount > 0 &&
				createElement(
					'span',
					{ className: 'datamachine-chat__fab-badge' },
					unreadCount > 99 ? '99+' : unreadCount
				)
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
					'\u00D7'
				)
			),
			createElement(
				'div',
				{ className: 'datamachine-chat__body' },
				createElement( Chat, {
					basePath,
					fetchFn: agentFetch,
					agentId,
					showTools: true,
					showSessions: true,
					toolRenderers,
					placeholder: __( `Ask ${ agentName } anything…`, 'data-machine-frontend-chat' ),
					metadata,
					isVisible: isOpen,
					onUnreadChange: setUnreadCount,
					emptyState: createElement(
						'div',
						{ className: 'datamachine-chat__empty' },
						createElement( 'h3', null, agentName ),
						createElement( 'p', null, agentDescription )
					),
				loadingMessages,
				mediaUploadFn: wpMediaUpload,
				processingLabel: ( turnCount: number ) =>
					__( `Working… (turn ${ turnCount })`, 'data-machine-frontend-chat' ),
				} )
			)
		)
	);
}
