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
  let sortedSbigMovies = sbigMovies.slice();
  const embedsArray: EmbedBuilder[] = new Array<EmbedBuilder>();
  const paginationRow = createPaginationButtonActionRow();
  const selectMenuRow = createSelectMenus();
  let chunkedSbigMovies = chunkArray(sortedSbigMovies, 3);
  let currentPageNo = 0;
  let totalMovies = sortedSbigMovies.length;
  let currentPage = chunkedSbigMovies[currentPageNo];
  for (const movie of currentPage) {
    embedsArray.push(createMovieSummaryEmbed(movie, await interaction.client.users.fetch(movie.sbigSubmitter)));
  }
  // const sbigSummaryEmbed = createSbigSummaryEmbed(sbigMovies, title);
  // const sbigPlayerRankingEmbed = createSbigPlayerSummaryEmbed(calculatePlayerRankings(sbigMovies));
  // embedsArray = [sbigSummaryEmbed, sbigPlayerRankingEmbed];
  const interactionResponse = await interaction.reply({ content: `Total Movies: ${sbigMovies.length}\n${currentPageNo + 1}/${chunkedSbigMovies.length }`, embeds: embedsArray.map(embed => embed.toJSON()), components: [paginationRow, ...selectMenuRow.map(row => row.toJSON())] });
  const rankFilterCollector = interactionResponse.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 600000 });
  const submitterFilterCollector = interactionResponse.createMessageComponentCollector({ componentType: ComponentType.UserSelect, time: 600000 });
  const paginationCollector = interactionResponse.createMessageComponentCollector({ componentType: ComponentType.Button, time: 600000 });

  paginationCollector.on('collect', async i => {
    const selection = i.customId;
    if (selection === 'Next') {
      if (currentPageNo >= chunkedSbigMovies.length - 1) {
        currentPageNo = 0;
      }
      else {
        currentPageNo++;
      }
      currentPage = chunkedSbigMovies[currentPageNo];
      embedsArray.splice(0, embedsArray.length);
    } else if (selection === 'Prev') {
      if (currentPageNo <= 0) {
        currentPageNo = chunkedSbigMovies.length - 1;
      }
      else {
        currentPageNo--;
      }
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

    interaction.editReply({ content: `Total Movies: ${totalMovies}\n ${currentPageNo + 1}/${chunkedSbigMovies.length}`, embeds: embedsArray.map(embed => embed.toJSON()) });

  });

  paginationCollector.on('end', () => {

    interaction.editReply({ content:'end', embeds: [], components: [] });
  });

  rankFilterCollector.on('collect', async i => {
    const selection = i.values[0];
    embedsArray.splice(0, embedsArray.length);

    sortedSbigMovies = sbigMovies.slice();
    const filteredSbigMovies = sortedSbigMovies.filter(movie => movie.sbigRank === selection);
    totalMovies = filteredSbigMovies.length;
    chunkedSbigMovies = chunkArray(filteredSbigMovies, 3);
    currentPageNo = 0;
    currentPage = chunkedSbigMovies[currentPageNo];
    for (const movie of currentPage) {
      embedsArray.push(createMovieSummaryEmbed(movie, await interaction.client.users.fetch(movie.sbigSubmitter)));
    }

    interaction.editReply({ content: `Total Movies: ${totalMovies}\n ${currentPageNo + 1}/${chunkedSbigMovies.length }`, embeds: embedsArray.map(embed => embed.toJSON()) });

  });

  submitterFilterCollector.on('collect', async i => {
    const selection = i.values[0];
    embedsArray.splice(0, embedsArray.length);

    sortedSbigMovies = sbigMovies.slice();
    const filteredSbigMovies = sortedSbigMovies.filter(movie => movie.sbigSubmitter === selection);
    totalMovies = filteredSbigMovies.length;
    chunkedSbigMovies = chunkArray(filteredSbigMovies, 3);
    currentPageNo = 0;
    currentPage = chunkedSbigMovies[currentPageNo];
    for (const movie of currentPage) {
      embedsArray.push(createMovieSummaryEmbed(movie, await interaction.client.users.fetch(movie.sbigSubmitter)));
    }

    interaction.editReply({ content: `Total Movies: ${totalMovies}\n ${currentPageNo + 1}/${chunkedSbigMovies.length }`, embeds: embedsArray.map(embed => embed.toJSON()) });

  });
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const results = [];
  while (array.length) {
      results.push(array.splice(0, chunkSize));
  }
  return results;
}