declare module '@wordpress/api-fetch' {
	type ApiFetchOptions = {
		path?: string;
		url?: string;
		method?: string;
		data?: unknown;
		body?: unknown;
		[key: string]: unknown;
	};

	export default function apiFetch<T = unknown>( options: ApiFetchOptions ): Promise<T>;
}
