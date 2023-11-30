import { OmdbData } from '../lib/omdb-data';


export async function omdbHandler(query: string) : Promise<OmdbData> {
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

    const response = await fetch(`https://www.omdbapi.com/?${searchParam}&type=movie&apikey=${process.env.OMDB_ACCESS_TOKEN}`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    } else {
        const movieResponse = await convertApiResponseToMovieDataObject(response);
        return movieResponse;
    }
}

async function convertApiResponseToMovieDataObject(response: Response) : Promise<OmdbData> {
    const data = await response.json();
    if (data.Error) {
        throw new Error(`OMDB Service error! message: ${data.Error}`);
    }
    const movieDataToReturn = new OmdbData(
        data.Title,
        data.Plot,
        data.Poster,
        data.imdbRating,
        data.Genre,
        data.Released,
        data.Runtime,
        data.Rated,
        data.Year,
        data.Ratings,
        data.Director,
        data.Actors,
        data.Writer,
        data.BoxOffice,
        data.imdbID
    );
    return movieDataToReturn;
}