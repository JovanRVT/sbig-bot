import { SlashCommandBuilder } from 'discord.js';
import { MovieData, SlashCommand } from '../../types';
import { createSbigSummaryEmbed } from '../../utils/discord-utils';
import { readMovies } from '../../services/crud-service';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('List the SBIG Rankings'),
	async execute(interaction) {

    const sbigMovies : MovieData[] = readMovies('sbigMovies.json');
    const sbigSummaryEmbed = createSbigSummaryEmbed(sbigMovies);
    await interaction.reply({ embeds: [sbigSummaryEmbed] });
  },
};
