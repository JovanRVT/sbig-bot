import fs from 'fs';
import { MovieData } from '../types';

export function upsertMovie(movie: MovieData, filePath:string) {
    const data = fs.readFileSync(filePath, 'utf-8');
    const movies: MovieData[] = JSON.parse(data);

	// Check if movie with the same imdbId already exists
	const duplicate = findDuplicateMovie(filePath, movie.imdbId);
	if (duplicate) {
		console.log('Movie with the same imdbId already exists, calling update');
		updateMovie(movie.imdbId, movie, filePath);
		return;
	}

    movies.push(movie);
    fs.writeFileSync(filePath, JSON.stringify(movies, null, 2));
}

// Read
export function readMovies(filePath: string): MovieData[] {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}

export function findDuplicateMovie(filePath: string, search:string) : MovieData | undefined {
	const data = fs.readFileSync(filePath, 'utf-8');
    const movies: MovieData[] = JSON.parse(data);

	return (movies.find(m => m.imdbId === search || m.title === search));
}

// Update
export function updateMovie(id: string, updatedMovie: MovieData, filePath:string) {
    const movies: MovieData[] = readMovies(filePath);
    const index = movies.findIndex(movie => movie.imdbId === id);
    if (index !== -1) {
        movies[index] = updatedMovie;
        fs.writeFileSync(filePath, JSON.stringify(movies, null, 2));
    }
}

// Delete
export function deleteMovie(id: string, filePath:string) {
    let movies: MovieData[] = readMovies(filePath);
    movies = movies.filter(movie => movie.imdbId !== id);
    fs.writeFileSync(filePath, JSON.stringify(movies, null, 2));
}