import { User, EmbedBuilder } from 'discord.js';
import { MovieData } from '../types';

export function createMovieDetailsEmbed(movieData: MovieData, submitter:User) : EmbedBuilder {
	const movieDetailsEmbed = new EmbedBuilder()
        .setColor(0x9370db)
		.setAuthor({ name: submitter.displayName, iconURL: submitter.avatarURL() || undefined })
        .setTitle(movieData.title)
        .setDescription(movieData.plot)
        .addFields(
          { name: `IMDB Rating: ${movieData.imdbRating}`, value: `${printOtherRatings(movieData.otherRatings)}`, inline: true },
          { name: 'Year', value:  `${movieData.year}`, inline: true },
          { name: 'Runtime', value: `${movieData.runtime}`, inline: true },
          { name: 'Genre', value: `${movieData.genre}`, inline: true },
          { name: 'Rating', value: `${movieData.rating}`, inline: true },
          { name: 'Box Office', value: `${movieData.boxOffice}`, inline: true },
          { name: 'Actors', value: `${movieData.actors}`, inline: true },
          { name: 'Director', value: `${movieData.director}`, inline: true },
          { name: 'Writers', value: `${movieData.writers}`, inline: true },
        );

	if (movieData.image != 'N/A') {
		movieDetailsEmbed.setImage(movieData.image);
	}
	return movieDetailsEmbed;
}

function printOtherRatings(otherRatings: {Source: string, Value: string}[]) : string {
	let formattedString = '';
	if (otherRatings.length == 0) {
		return ' ';
	}

    for (const rating of otherRatings) {
        formattedString += `${rating.Source}: ${rating.Value}\n`;
    }
    return formattedString;
}