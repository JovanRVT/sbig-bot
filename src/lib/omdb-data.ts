export class OmdbData {
    title: string;
    plot: string;
    image: string;
    imdbRating: number;
    genre: string;
    release: string;
    runtime: string;
    rating: string;
    year: number;
    otherRatings: {Source: string, Value: string}[];
    director: string;
    actors: string;
    writers: string;
    boxOffice: string;
    imdbId: string;

    constructor(title: string, plot: string, image: string, imdbRating: number, genre: string, release: string, runtime: string,
                rating: string, year: number, otherRatings: {Source: string, Value: string}[], director: string, actors: string,
                writers: string, boxOffice: string, imdbId: string)
    {
        this.title = title;
        this.plot = plot;
        this.image = image;
        this.imdbRating = imdbRating;
        this.genre = genre;
        this.release = release;
        this.runtime = runtime;
        this.rating = rating;
        this.year = year;
        this.otherRatings = otherRatings;
        this.director = director;
        this.actors = actors;
        this.writers = writers;
        this.boxOffice = boxOffice;
        this.imdbId = imdbId;
    }

    printOtherRatings() : string {
        let formattedString = '';
        if (this.otherRatings.length == 0) {
            return ' ';
        }
        for (const rating of this.otherRatings) {
            formattedString += `${rating.Source}: ${rating.Value}\n`;
        }
        return formattedString;
    }
  }