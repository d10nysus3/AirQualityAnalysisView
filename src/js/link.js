import axios from "axios"


function apiUrl() {
    if (process.env.NODE_ENV === 'development') {
        return 'http://192.168.228.17:8000/'
    } else if (process.env.NODE_ENV === 'production') {
        return '/api/'
    }
}

export const baseServer = axios.create({
    baseURL: apiUrl(),
    timeout: 999999999,
    headers: {
        'Content-Type': 'application/json'
    },
});