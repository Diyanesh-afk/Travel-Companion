const API_BASE_URL =
    "https://travel-companion-coral.vercel.app";


function buildUrl(path) {
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    if (!path.startsWith("/")) {
        path = "/" + path;
    }

    return `${API_BASE_URL}${path}`;
}


function getCookie(name) {
    const cookies = document.cookie.split("; ");

    const cookie = cookies.find(row =>
        row.startsWith(`${name}=`)
    );

    return cookie
        ? decodeURIComponent(cookie.split("=")[1])
        : "";
}


async function getCsrfToken() {
    const response = await fetch(
        `${API_BASE_URL}/api/csrf/`,
        {
            credentials: "include",
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error ||
            "Unable to get CSRF token."
        );
    }

    return data.csrfToken;
}


async function api(path, options = {}) {
    const method =
        (options.method || "GET").toUpperCase();

    const url = buildUrl(path);

    const headers = {
        ...(options.headers || {}),
    };

    const isFormData =
        options.body instanceof FormData;

    if (!isFormData && options.body !== undefined) {
        headers["Content-Type"] =
            "application/json";
    }

    if (
        method !== "GET" &&
        method !== "HEAD" &&
        method !== "OPTIONS"
    ) {
        const csrfToken =
            getCookie("csrftoken") ||
            await getCsrfToken();

        headers["X-CSRFToken"] = csrfToken;
    }

    const response = await fetch(
        url,
        {
            ...options,
            credentials: "include",
            headers,
        }
    );

    const text =
        await response.text();

    let data = {};

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(
                `Server returned an invalid response (${response.status}).`
            );
        }
    }

    if (!response.ok) {
        throw new Error(
            data?.error ||
            data?.detail ||
            `Request failed (${response.status}).`
        );
    }

    return data;
}


export const get = (path) => {
    return api(path);
};


export const post = (path, body = {}) => {
    const isFormData =
        body instanceof FormData;

    return api(path, {
        method: "POST",
        body: isFormData
            ? body
            : JSON.stringify(body),
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


export const del = (path) => {
    return api(path, {
        method: "DELETE",
    });
};


export const auth = {
    me: () =>
        get("/api/me/"),

    login: (body) =>
        post("/api/auth/login/", body),

    register: (body) =>
        post("/api/auth/register/", body),

    logout: () =>
        post("/api/auth/logout/"),
};


export default api;