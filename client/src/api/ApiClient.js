export class ApiClient {
    #baseUrl;
    #getToken;

    constructor(baseUrl, getToken = null) {
        this.#baseUrl = baseUrl;
        this.#getToken = getToken;
    }

    async #getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (this.#getToken) {
            const token = await this.#getToken();
            headers.Authorization = `Bearer ${token}`;
        }
        return headers;
    }

    async #request(method, path, { params, body } = {}) {
        let urlString = `${this.#baseUrl}${path}`;
        
        if (params) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([k, v]) => {if (v !== undefined) searchParams.set(k, v)});
            urlString += `?${searchParams.toString()}`;
        }

        const res = await fetch(urlString, {
            method,
            headers: await this.#getHeaders(),
            ...(body && { body: JSON.stringify(body) }),
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new ApiError(res.status, error.message ?? 'Request failed.');
        }

        return res.json();
    }

    get(path, params) { return this.#request('GET', path, { params }); } // get shouldnt have body
    post(path, body, params) { return this.#request('POST', path, { body, params }); }
    put(path, body, params) { return this.#request('PUT', path, { body, params }); }
    patch(path, body, params) { return this.#request('PATCH', path, { body, params }); }
    delete(path, body, params) { return this.#request('DELETE', path, { body, params }); }
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
