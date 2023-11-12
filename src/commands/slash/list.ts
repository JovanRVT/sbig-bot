import { SlashCommandBuilder } from 'discord.js';
import { MovieData, SlashCommand } from '../../types';
import { createSbigPlayerSummaryEmbed, createSbigSummaryEmbed } from '../../utils/discord-utils';
import { readMovies } from '../../services/crud-service';
import { calculatePlayerRankings } from '../../services/vote-service';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('List the SBIG Rankings')
    .addBooleanOption(option =>
			option
				.setName('interactive')
				.setDescription('Enable interactive viewing of the SBIG Rankings')
				.setRequired(false))
    .addUserOption(option =>
			option
				.setName('user')
				.setDescription('User to filter movies by')
				.setRequired(false)),
	async execute(interaction) {

    let sbigMovies : MovieData[] = readMovies('sbigMovies.json');

    let title = 'SBIG Movie Rankings';

    // Pull input submitter
    const submitterOption = interaction.options.get('user');
    if (submitterOption && submitterOption.user) {
      const submitter = submitterOption.user;
      sbigMovies = sbigMovies.filter(movie => movie.sbigSubmitter === submitter.id);
      title += ` for ${submitter.displayName}`;
    }

    const sbigSummaryEmbed = createSbigSummaryEmbed(sbigMovies, title);
    const sbigPlayerRankingEmbed = createSbigPlayerSummaryEmbed(calculatePlayerRankings(sbigMovies));
    const embedsArray = [sbigSummaryEmbed, sbigPlayerRankingEmbed];
    // if (interaction.options.get('interactive')) {
    //   for (const movie of sbigMovies) {
    //     embedsArray.push(createMovieDetailsEmbed(movie, await interaction.client.users.fetch(movie.sbigSubmitter)));
    //   }
    // }

    await interaction.reply({ embeds: embedsArray.map(embed => embed.toJSON()) });
  },
};

// function handleInteractiveMovieList() {
// }
