import axios from "axios";

// TODO UPDATE THE BASE URL HERE SO THAT IT WORKS IN DEPLOYMENT
export const axiosInstance = axios.create({
  baseURL: "/api",
  withCredentials: true,
});