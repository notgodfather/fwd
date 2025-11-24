import axios from 'axios';

const api = axios.create({
  baseURL: 'https://fwdbackend.onrender.com',
});

export default api;
