import { upsertMovie, findDuplicateMovie } from '../services/crud-service';
import { MovieData } from '../types';

if (!process.env.OMDB_ACCESS_TOKEN) {
    throw new Error('No omdb token found!');
}

export async function omdbHandler(query: string) : Promise<MovieData> {
    let searchParam = '';
    if (query.startsWith('tt')) {
        searchParam = `i=${query}`;
    }
    else if (query.startsWith('http') && query.includes('title/tt')) {
        const imdbId = query.split('/').filter(part => part.startsWith('tt'))[0];
        searchParam = `i=${imdbId}`;
        query = imdbId;
    }
    else {
        query = query.charAt(0).toUpperCase() + query.slice(1);
        searchParam = `t=${query}`;
    }

    const cachedValue = checkCachedValues(query);
    if (cachedValue) {;
        return cachedValue;
    }

    const response = await fetch(`https://www.omdbapi.com/?${searchParam}&type=movie&apikey=${process.env.OMDB_ACCESS_TOKEN}`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    } else {
        const movieResponse = await convertApiResponseToMovieDataObject(response);
        upsertMovie(movieResponse, 'cache.json');
        return movieResponse;
    }
}

function checkCachedValues(searchString: string) {
    let cachedValue = findDuplicateMovie('sbigMovies.json', searchString);
    if (cachedValue) {
        console.log('Pulled from sbigMovies.json!');
        return cachedValue;
    }

    cachedValue = findDuplicateMovie('cache.json', searchString);
    if (cachedValue) {
        console.log('Pulled from cache.json!');
        return cachedValue;
    }
}

async function convertApiResponseToMovieDataObject(response: Response) : Promise<MovieData> {
    const data = await response.json();
    if (data.Error) {
        throw new Error(`OMDB Service error! message: ${data.Error}`);
    }
    const movieDataToReturn : MovieData = {
        sbigRank: '',
        sbigWatchedDate: '',
        sbigNotes: '',
        sbigSubmitter: '',
        sbigVoteResults: '',
        title: data.Title,
        plot: data.Plot,
        image: data.Poster,
        genre: data.Genre,
        release: data.Released,
        runtime: data.Runtime,
        year: data.Year,
        imdbRating: data.imdbRating,
        rating: data.Rated,
        otherRatings: data.Ratings,
        director: data.Director,
        actors: data.Actors,
        writers: data.Writer,
        boxOffice: data.BoxOffice,
        imdbId: data.imdbID,
    };
    return movieDataToReturn;
}