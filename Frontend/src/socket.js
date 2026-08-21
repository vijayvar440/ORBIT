import axios from "axios";
import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_API_URL || "https://orbit-backend-94nx.onrender.com";

// 1. Axios Instance Setup
export const API = axios.create({ 
  baseURL: BACKEND_URL,
  withCredentials: true
});

// 2. Socket Connection Setup
const socket = io(BACKEND_URL, {
  transports: ["websocket", "polling"]
});

export default socket;