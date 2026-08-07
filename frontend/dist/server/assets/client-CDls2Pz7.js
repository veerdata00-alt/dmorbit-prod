import axios from "axios";
//#region src/lib/api/client.ts
var apiClient = axios.create({
	withCredentials: true,
	headers: { "Content-Type": "application/json" }
});
apiClient.interceptors.response.use((response) => response, (error) => {
	if (error.response && error.response.status === 401) console.warn("API returned 401 Unauthorized");
	return Promise.reject(error);
});
//#endregion
export { apiClient as t };
