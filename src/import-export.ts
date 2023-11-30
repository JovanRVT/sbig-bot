import { Op } from 'sequelize';
import './assert-env-vars';
import { OmdbData } from './lib/omdb-data';
import { TierListEntry } from './lib/tier-list-entry';
import { readMovies } from './services/crud-service';


export type OldMovieData = {
  sbigRank: string;
  sbigNotes: string;
  sbigWatchedDate: string;
  sbigSubmitter: string;
  sbigVoteResults: string,
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
}

const CATEGORY = '';
const GUILD_ID = '';

(async () => {
  const movies = readMovies(CATEGORY + '.json');
  for (const movie of movies) {
    const externalData = new OmdbData(
      movie.title,
      movie.plot,
      movie.image,
      movie.imdbRating,
      movie.genre,
      movie.release,
      movie.runtime,
      movie.rating,
      movie.year,
      movie.otherRatings,
      movie.director,
      movie.actors,
      movie.writers,
      movie.boxOffice,
      movie.imdbId
    );

    const existingTierListEntry = await TierListEntry.findOne({ where: { externalDataId:{ [Op.eq]:movie.imdbId } } });
    if (existingTierListEntry !== null && existingTierListEntry !== undefined) {
      existingTierListEntry.update({
        tier: movie.sbigRank,
        notes: movie.sbigNotes,
        submitter: movie.sbigSubmitter,
        voteResults: new Map(Object.entries(JSON.parse(movie.sbigVoteResults))),
        externalData: externalData,
        externalDataId: externalData.imdbId,
        category: CATEGORY,
        guildId: GUILD_ID,
        createdAt: movie.sbigWatchedDate,
      });
    }
    else {
      await TierListEntry.create({
        tier: movie.sbigRank,
        notes: movie.sbigNotes,
        submitter: movie.sbigSubmitter,
        voteResults: new Map(Object.entries(JSON.parse(movie.sbigVoteResults))),
        externalData: externalData,
        externalDataId: externalData.imdbId,
        category: CATEGORY,
        guildId: GUILD_ID,
        createdAt: movie.sbigWatchedDate,
      });
    }
  }
})();
