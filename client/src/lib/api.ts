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
export const getRecommendations = (users: any[], seenIds: number[] = []) => api.post('/recommendations', { users, seen_ids: seenIds });
export const getTrailers = () => api.get('/movies/trailers');
export const getMovieVideos = (movieId: number) => api.get(`/movie/${movieId}/videos`);
export const addToSharedList = (sessionId: number, movieId: number, movieData: any, addedBy: number) => 
  api.post('/list/add', { session_id: sessionId, movie_id: movieId, movie_data: movieData, added_by: addedBy });
export const getSharedList = (sessionId: number) => api.get(`/session/${sessionId}/list`);
export const voteMovie = (sessionId: number, movieId: number, userId: number, vote: number) => 
  api.post('/vote', { session_id: sessionId, movie_id: movieId, user_id: userId, vote_value: vote });
export const removeMovieFromList = (sessionId: number, movieId: number) => api.post('/list/remove', { session_id: sessionId, movie_id: movieId });
export const finalizeSession = (sessionId: number) => api.post(`/session/${sessionId}/finalize`);
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

// Game
export const submitRPSMove = (sessionId: number, userId: number, move: string) => 
    api.post('/game/rps/move', { session_id: sessionId, user_id: userId, move });
export const getRPSStatus = (sessionId: number) => api.get(`/game/rps/${sessionId}`);
export const resetRPSGame = (sessionId: number) => api.post(`/game/rps/${sessionId}/reset`);

// Movie IQ
export const startMovieIQ = (sessionId: number) => api.post('/game/iq/start', { session_id: sessionId });
export const getMovieIQStatus = (sessionId: number) => api.get(`/game/iq/${sessionId}`);
export const submitMovieIQAnswer = (sessionId: number, userId: number, nickname: string, answer: string) => 
    api.post('/game/iq/answer', { session_id: sessionId, user_id: userId, nickname, answer });
export const resetMovieIQ = (sessionId: number) => api.post(`/game/iq/${sessionId}/reset`);

// Admin
export const seedTMDB = (pages: number = 1, type: 'popular' | 'top_rated' = 'popular') => 
    api.post('/admin/seed-tmdb', { pages, type });
export const clearMovies = () => api.delete('/admin/movies');

export default api;
