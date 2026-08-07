export const request = async (url, options = {}) => {
    try {
        const res = await fetch(url, options);
        if (res.status === 401) {
            window.location.href = '/'; 
            return;
        }
        return await res.json();
    } catch (err) {
        return { success: false, error: "Network Error" };
    }
};

export const API = {
    me: () => request('/api/me'),
    logout: () => request('/api/logout', { method: 'POST' }),
    stats: () => request('/api/dashboard/stats'),
    accountStatus: () => request('/api/account/status'),
    automations: () => request('/api/v2/automations'),
    createAutomation: (data) => request('/api/v2/automations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    logs: (page = 1) => request(`/api/logs?page=${page}&limit=20`),
    accountHealth: () => request('/api/account/health')
};
