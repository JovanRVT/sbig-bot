import { SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../../types';
import { omdbHandler } from '../../services/omdb-service';
import { createMovieDetailsEmbed, createVotingResultsEmbed } from '../../utils/discord-utils';
import { logToDevChannel } from '../../utils/utils';
import { TierListEntry } from '../../lib/tier-list-entry';
import { OmdbData } from '../../lib/omdb-data';
import { Op } from 'sequelize';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
		.setName('show')
		.setDescription('Show movie details by Title, IMDB Link, or IMDB ID.')
    .addStringOption(option =>
      option.setName('movie')
        .setDescription('Movie Title, IMDB link, or IMDB ID (e.g. tt0130236)')
        .setRequired(true)
    ),
	async execute(interaction) {
    // Pull input movie
    const movieOption = interaction.options.get('movie');
    let movie = (movieOption && typeof movieOption.value === 'string') ? movieOption.value : '';


    let tierListEntry = TierListEntry.build() as TierListEntry<OmdbData>;
    if (movie != '') {
      try {
        const movieData = await omdbHandler(movie);
        // Check if already exists
        const dbResponse = await TierListEntry.findOne({ where: {
            externalDataId:{ [Op.eq]:movieData.imdbId },
            guildId: { [Op.eq]: interaction.guildId } },
          }) as TierListEntry<OmdbData> | null;
        if (!dbResponse) {
          // New Movie
          tierListEntry.externalData = movieData;
          const movieEmbed = createMovieDetailsEmbed(movieData, interaction.user, '');
          const embedsArray = [movieEmbed];
          await interaction.reply({ embeds: embedsArray.map(embed => embed.toJSON()) });
        }
        else {
          tierListEntry = dbResponse;
          const submitterUser = await interaction.client.users.fetch(tierListEntry.submitter);
          if (!submitterUser) {
            throw new Error(`User with ID ${tierListEntry.submitter} not found.`);
          }
          const movieEmbed = createMovieDetailsEmbed(movieData, submitterUser, tierListEntry.notes);
          const embedsArray = [movieEmbed];

          const resultsEmbed = createVotingResultsEmbed(tierListEntry.voteResults, `Results from ${tierListEntry.getFormattedDate()}`);
          embedsArray.push(resultsEmbed);
          await interaction.reply({ embeds: embedsArray.map(embed => embed.toJSON()) });
        }
      } catch (error) {
        movie = '';
        console.error(error);
        logToDevChannel(interaction.client, String(error));
        await interaction.reply({ content: 'Error finding the movie. Please double check the title, link, or ID (e.g. tt0130236)', ephemeral:true });
      }
    }
  },
};
