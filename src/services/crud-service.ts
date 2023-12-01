import fs from 'fs';
import { OldMovieData } from '../import-export';

export function upsertMovie(movie: OldMovieData, filePath:string) {
    const data = fs.readFileSync(filePath, 'utf-8');
    const movies: OldMovieData[] = JSON.parse(data);

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
export function readMovies(filePath: string): OldMovieData[] {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}

export function findDuplicateMovie(filePath: string, search:string) : OldMovieData | undefined {
	const data = fs.readFileSync(filePath, 'utf-8');
    const movies: OldMovieData[] = JSON.parse(data);

	return (movies.find(m => m.imdbId === search || m.title === search));
}

// Update
export function updateMovie(id: string, updatedMovie: OldMovieData, filePath:string) {
    const movies: OldMovieData[] = readMovies(filePath);
    const index = movies.findIndex(movie => movie.imdbId === id);
    if (index !== -1) {
        movies[index] = updatedMovie;
        fs.writeFileSync(filePath, JSON.stringify(movies, null, 2));
    }
}

// Delete
export function deleteMovie(id: string, filePath:string) {
    let movies: OldMovieData[] = readMovies(filePath);
    movies = movies.filter(movie => movie.imdbId !== id);
    fs.writeFileSync(filePath, JSON.stringify(movies, null, 2));
}