import axios from 'axios';

const api = axios.create({
  baseURL: 'https://borty-ernesto-fairily.ngrok-free.dev/api',
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});

export const createSession = () => api.post('/session');
export const joinSession = (sessionId: number, nickname: string, sliders: any) => 
  api.post('/join', { session_id: sessionId, nickname, slider_values: sliders });
export const getSession = (code: string) => api.get(`/session/${code}`);
export const getSessionById = (id: number) => api.get(`/session/id/${id}`);
export const updateSessionVisibility = (id: number, isPublic: boolean) => api.put(`/session/${id}/visibility`, { is_public: isPublic });
export const getUsers = (sessionId: number) => api.get(`/session/${sessionId}/users`);
export const getRecommendations = (users: any[]) => api.post('/recommendations', { users });
export const getTrailers = () => api.get('/movies/trailers');
export const getMovieVideos = (movieId: number) => api.get(`/movie/${movieId}/videos`);
export const addToSharedList = (sessionId: number, movieId: number, movieData: any, addedBy: number) => 
  api.post('/list/add', { session_id: sessionId, movie_id: movieId, movie_data: movieData, added_by: addedBy });
export const getSharedList = (sessionId: number) => api.get(`/session/${sessionId}/list`);
export const voteMovie = (sessionId: number, movieId: number, userId: number, vote: number) => 
  api.post('/vote', { session_id: sessionId, movie_id: movieId, user_id: userId, vote_value: vote });
export const addToHistory = (sessionId: number, movieId: number, title: string, movieData: any, rating: number, accountId?: number) =>
    api.post('/history', { session_id: sessionId, movie_id: movieId, movie_title: title, movie_data: movieData, rating, account_id: accountId });
export const getHistory = (sessionId: number) => api.get(`/history/${sessionId}`);

// Auth & Account
export const getFavorites = () => api.get('/account/favorites');
export const addToFavorites = (movieId: number, movieData: any) => api.post('/account/favorites', { movie_id: movieId, movie_data: movieData });
export const removeFromFavorites = (movieId: number) => api.delete(`/account/favorites/${movieId}`);
export const getAccountHistory = () => api.get('/account/history');

export const verifyEmail = (token: string) => api.post('/auth/verify', { token });
export const subscribe = (username: string, paymentToken: string) => api.post('/auth/subscribe', { username, payment_token: paymentToken });

export default api;
