import { ChatInputCommandInteraction, ComponentType, EmbedBuilder, SlashCommandBuilder, User } from 'discord.js';
import { MovieData, SlashCommand } from '../../types';
import { createPaginationButtonActionRow as createPaginationButtonActionRow, createMovieSummaryEmbed, createSbigPlayerSummaryEmbed, createSbigSummaryEmbed, createSelectMenus } from '../../utils/discord-utils';
import { readMovies } from '../../services/crud-service';
import { calculatePlayerRankings, getWeightByKey } from '../../services/vote-service';

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

    // Pull input submitter
    const submitterOption = interaction.options.get('user');
    let submitter : User | null = null;
    if (submitterOption && submitterOption.user) {
      submitter = submitterOption.user;
    }

    let title = 'SBIG Movie Rankings';

    if (interaction.options.get('interactive')) {
      await handleInteractiveMovieList(interaction, submitter, sbigMovies, title);
    }
    else {

      if (submitter !== null) {
          sbigMovies = sbigMovies.filter(movie => movie.sbigSubmitter === submitter?.id);
          title += ` for ${submitter.displayName}`;
      }

      const sbigSummaryEmbed = createSbigSummaryEmbed(sbigMovies, title);
      const sbigPlayerRankingEmbed = createSbigPlayerSummaryEmbed(calculatePlayerRankings(sbigMovies));
      const embedsArray = [sbigSummaryEmbed, sbigPlayerRankingEmbed];
      await interaction.reply({ embeds: embedsArray.map(embed => embed.toJSON()) });
    }
  },
};

async function handleInteractiveMovieList(interaction:ChatInputCommandInteraction, submitter : User | null, sbigMovies:MovieData[], title:string) {
  sbigMovies.sort((a, b) => getWeightByKey(b.sbigRank) - getWeightByKey(a.sbigRank));
  const embedsArray: EmbedBuilder[] = new Array<EmbedBuilder>();
  const paginationRow = createPaginationButtonActionRow();
  const selectMenuRow = createSelectMenus();
  const chunkedSbigMovies = chunkArray(sbigMovies, 3);
  let currentPageNo = 0;
  let currentPage = chunkedSbigMovies[currentPageNo];
  for (const movie of currentPage) {
    embedsArray.push(createMovieSummaryEmbed(movie, await interaction.client.users.fetch(movie.sbigSubmitter)));
  }
  // const sbigSummaryEmbed = createSbigSummaryEmbed(sbigMovies, title);
  // const sbigPlayerRankingEmbed = createSbigPlayerSummaryEmbed(calculatePlayerRankings(sbigMovies));
  // embedsArray = [sbigSummaryEmbed, sbigPlayerRankingEmbed];
  const interactionResponse = await interaction.reply({ content: `${currentPageNo}/${chunkedSbigMovies.length - 1}`, embeds: embedsArray.map(embed => embed.toJSON()), components: [paginationRow, selectMenuRow.toJSON()] });
  const paginationCollector = interactionResponse.createMessageComponentCollector({ componentType: ComponentType.Button, time: 600000 });

  paginationCollector.on('collect', async i => {
    const selection = i.customId;
    if (selection === 'Next') {
      currentPageNo++;
      currentPage = chunkedSbigMovies[currentPageNo];
      embedsArray.splice(0, embedsArray.length);
    } else if (selection === 'Prev') {
      currentPageNo--;
      currentPage = chunkedSbigMovies[currentPageNo];
      embedsArray.splice(0, embedsArray.length);
    } else if (selection === 'Last') {
      currentPageNo = chunkedSbigMovies.length - 1;
      currentPage = chunkedSbigMovies[currentPageNo];
      embedsArray.splice(0, embedsArray.length);
    } else if (selection === 'First') {
      currentPageNo = 0;
      currentPage = chunkedSbigMovies[currentPageNo];
      embedsArray.splice(0, embedsArray.length);
    } else if (selection === 'Stop') {
      paginationCollector.stop();
      return;
    }

    for (const movie of currentPage) {
      embedsArray.push(createMovieSummaryEmbed(movie, await interaction.client.users.fetch(movie.sbigSubmitter)));
    }

    interaction.editReply({ content: `${currentPageNo}/${chunkedSbigMovies.length - 1}`, embeds: embedsArray.map(embed => embed.toJSON()) });

  });

  paginationCollector.on('end', () => {

    interaction.editReply({ content:'end', embeds: [], components: [] });
  });
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const results = [];
  while (array.length) {
      results.push(array.splice(0, chunkSize));
  }
  return results;
}