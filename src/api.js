const API_BASE_URL = "https://travel-companion-coral.vercel.app";

let csrfToken = null;

async function getCsrfToken() {
    if (csrfToken) {
        return csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/api/csrf/`, {
        method: "GET",
        credentials: "include",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.detail ||
            `CSRF request failed (${response.status})`
        );
    }

    csrfToken = data.csrfToken;

    return csrfToken;
}

const api = async (path, options = {}) => {
    const method = (options.method || "GET").toUpperCase();

    const headers = {
        ...(options.headers || {}),
    };

    if (
        options.body &&
        !(options.body instanceof FormData) &&
        !headers["Content-Type"]
    ) {
        headers["Content-Type"] = "application/json";
    }

    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
        const token = await getCsrfToken();

        if (token) {
            headers["X-CSRFToken"] = token;
        }
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        credentials: "include",
        ...options,
        headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.detail ||
            `Request failed (${response.status})`
        );
    }

    return data;
};

export const get = (path) => {
    return api(path);
};

export const post = (path, body = {}) => {
    return api(path, {
        method: "POST",
        body: JSON.stringify(body),
    });
};

export const del = (path) => {
    return api(path, {
        method: "DELETE",
    });
};

export const put = (path, body = {}) => {
    return api(path, {
        method: "PUT",
        body: JSON.stringify(body),
    });
};

export const patch = (path, body = {}) => {
    return api(path, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
};

export const auth = {
    me: () => get("/api/me/"),

    login: (body) => {
        return post("/api/auth/login/", body);
    },

    register: (body) => {
        return post("/api/auth/register/", body);
    },

    logout: () => {
        return post("/api/auth/logout/");
    },
};

export default api;