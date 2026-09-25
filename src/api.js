function getCookie(name) {
    const cookies = document.cookie ? document.cookie.split("; ") : [];

    for (const cookie of cookies) {
        const [key, ...valueParts] = cookie.split("=");

        if (key === name) {
            return decodeURIComponent(valueParts.join("="));
        }
    }

    return null;
}


const api = async (path, options = {}) => {
    const method = (options.method || "GET").toUpperCase();

    const headers = {
        ...(options.headers || {}),
    };

    // Only add JSON content type when we are actually sending JSON.
    if (
        options.body &&
        !(options.body instanceof FormData) &&
        !headers["Content-Type"]
    ) {
        headers["Content-Type"] = "application/json";
    }

    // Django CSRF protection.
    // Required for unsafe requests such as POST, PUT, PATCH and DELETE.
    if (
        ["POST", "PUT", "PATCH", "DELETE"].includes(method)
    ) {
        const csrfToken = getCookie("csrftoken");

        if (csrfToken) {
            headers["X-CSRFToken"] = csrfToken;
        }
    }

    const response = await fetch(path, {
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