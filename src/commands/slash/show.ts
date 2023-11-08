import { SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../../types';
import { omdbHandler } from '../../api/omdb';
import { createMovieDetailsEmbed } from '../../services/movie-service';

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

    if (movie != '') {
      try {
        const movieData = await omdbHandler(movie);
        const movieEmbed = createMovieDetailsEmbed(movieData, interaction.user);
        await interaction.reply({ embeds: [movieEmbed] });
      } catch (error) {
        movie = '';
        console.error(error);
        await interaction.reply({ content: 'Error finding the movie. Please double check the title, link, or ID (e.g. tt0130236)', ephemeral:true });
      }
    }
  },
};
