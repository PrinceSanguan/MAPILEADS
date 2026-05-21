/** Reads a cookie by name, returning its raw (still URL-encoded) value or null. */
function readCookie(name: string): string | null {
    const prefix = `${name}=`;

    for (const part of document.cookie.split('; ')) {
        if (part.startsWith(prefix)) {
            return part.slice(prefix.length);
        }
    }

    return null;
}

/**
 * POSTs a JSON body to a Laravel endpoint with the decoded XSRF token.
 *
 * The `XSRF-TOKEN` cookie is URL-encoded; Laravel rejects the raw value with a
 * 419, so it must be `decodeURIComponent`-ed before being sent back as a header.
 *
 * @throws Error with the server's `{ message }` (or a generic fallback) on non-2xx.
 */
export async function postJson<T>(url: string, body: unknown): Promise<T> {
    const rawToken = readCookie('XSRF-TOKEN');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    if (rawToken) {
        headers['X-XSRF-TOKEN'] = decodeURIComponent(rawToken);
    }

    const res = await fetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        let message: string | undefined;

        try {
            const data = (await res.json()) as { message?: string };
            message = data?.message;
        } catch {
            // Body was not JSON (e.g. an HTML error page) — fall back below.
        }

        throw new Error(message ?? 'Request failed');
    }

    return (await res.json()) as T;
}
