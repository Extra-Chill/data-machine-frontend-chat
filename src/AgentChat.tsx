/**
 * AgentChat — Floating agent chat panel with diff visualization.
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
import type { ReactNode } from 'react';

/**
 * Upload function provided by the consumer.
 * Matches @extrachill/chat MediaUploadFn (available in v0.9.0+).
 */
type MediaUploadFn = ( file: File ) => Promise<{ url: string; media_id?: number }>;

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
		console.error( 'AgentChat: failed to resolve diff', diffId, err );
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
		onAccept: ( id: string ) => resolveDiff( id, 'accepted' ),
		onReject: ( id: string ) => resolveDiff( id, 'rejected' ),
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
