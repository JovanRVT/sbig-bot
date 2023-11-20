import { ChatInputCommandInteraction, ComponentType, SlashCommandBuilder, User, hyperlink } from 'discord.js';
import { MovieData, SlashCommand } from '../../types';
import { createPaginationButtonActionRow as createPaginationButtonActionRow, createMovieSummaryEmbed, createSbigPlayerSummaryEmbed, createSbigSummaryEmbed, createSelectMenus } from '../../utils/discord-utils';
import { readMovies } from '../../services/crud-service';
import { calculatePlayerRankings, getWeightByKey } from '../../services/vote-service';
import { logToDevChannel } from '../../utils/utils';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('List the SBIG Rankings')
    .addBooleanOption(option =>
      option
        .setName('interactive')
        .setDescription('Enable interactive (movie details with pagination and filters) viewing of the SBIG Rankings')
        .setRequired(false))
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to filter movies by. Does not apply to interactive.')
        .setRequired(false)),
  async execute(interaction) {
    try {
      let sbigMovies: MovieData[] = readMovies('sbigMovies.json');

      // Pull input submitter
      const submitterOption = interaction.options.get('user');
      let submitter: User | null = null;
      if (submitterOption && submitterOption.user) {
        submitter = submitterOption.user;
      }

      if (interaction.options.get('interactive')) {
        await handleInteractiveMovieList(interaction, sbigMovies);
      }
      else {
        let title = 'SBIG Movie Rankings';
        if (submitter !== null) {
          sbigMovies = sbigMovies.filter(movie => movie.sbigSubmitter === submitter?.id);
          title += ` for ${submitter.displayName}`;
        }

        const sbigSummaryEmbed = createSbigSummaryEmbed(sbigMovies, title);
        const sbigPlayerRankingEmbed = createSbigPlayerSummaryEmbed(calculatePlayerRankings(sbigMovies));
        const embedsArray = [sbigSummaryEmbed, sbigPlayerRankingEmbed];

        const url = 'https://docs.google.com/spreadsheets/d/1xC3lzmjn7pkE4JXJS7PnbPXJ8c0Kfn8r5aqQo5SOWNo/edit?usp=sharing';
        const link = hyperlink('Click here for OG Google Sheet List', url);
        await interaction.reply({ content: link, embeds: embedsArray.map(embed => embed.toJSON()) });
      }
    } catch (error) {
      logToDevChannel(interaction.client, String(error));
      await interaction.reply({ content: 'An error occurred while processing your request. Please try again later.' });
    }
  },
};

async function handleInteractiveMovieList(interaction: ChatInputCommandInteraction, sbigMovies: MovieData[]) {
  try {
    sbigMovies.sort((a, b) => getWeightByKey(b.sbigRank) - getWeightByKey(a.sbigRank));
    let numberOfResults = 3;
    let chunkedSbigMovies = chunkArray(sbigMovies.slice(), numberOfResults);
    let currentPageNo = 0;
    let totalMovies = sbigMovies.length;
    let embedsArray = await updateCurrentPageAndEmbeds(currentPageNo, chunkedSbigMovies, interaction);
    let submitterSelection: string[] = [];
    let rankSelection: string[] = [];

    const paginationRow = createPaginationButtonActionRow();
    const selectMenuRow = createSelectMenus();

    const interactionResponse = await interaction.reply({ content: `Total Movies: ${sbigMovies.length}\n${currentPageNo + 1}/${chunkedSbigMovies.length}`, embeds: embedsArray.map(embed => embed.toJSON()), components: [paginationRow, ...selectMenuRow.map(row => row.toJSON())] });

    const rankFilterAndNumberOfResultsCollector = interactionResponse.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 900000 });
    const submitterFilterCollector = interactionResponse.createMessageComponentCollector({ componentType: ComponentType.UserSelect, time: 900000 });
    const paginationCollector = interactionResponse.createMessageComponentCollector({ componentType: ComponentType.Button, time: 900000 });

    paginationCollector.on('collect', async i => {
      try {
        const selection = i.customId;
        if (selection === 'Next') {
          if (currentPageNo >= chunkedSbigMovies.length - 1) {
            currentPageNo = 0;
          }
          else {
            currentPageNo++;
          }
        } else if (selection === 'Prev') {
          if (currentPageNo <= 0) {
            currentPageNo = chunkedSbigMovies.length - 1;
          }
          else {
            currentPageNo--;
          }
        } else if (selection === 'Last') {
          currentPageNo = chunkedSbigMovies.length - 1;
        } else if (selection === 'First') {
          currentPageNo = 0;
        } else if (selection === 'Stop') {
          paginationCollector.stop();
          i.reply({ content: 'Interactive Session Ended.', ephemeral: true });
          return;
        }

        embedsArray = await updateCurrentPageAndEmbeds(currentPageNo, chunkedSbigMovies, interaction);
        i.update({ content: `Total Movies: ${totalMovies}\n ${currentPageNo + 1}/${chunkedSbigMovies.length}`, embeds: embedsArray.map(embed => embed.toJSON()) });
      } catch (error) {
        logToDevChannel(interaction.client, String(error));
        await i.reply({ content: 'An error occurred while processing your request. Please try again later.', ephemeral: true });
      }
    });

    paginationCollector.on('end', () => {
      interaction.deleteReply();
    });

    rankFilterAndNumberOfResultsCollector.on('collect', async i => {
      try {
        if (i.customId === 'numberOfResults') {
          numberOfResults = Number(i.values[0]);
          const filteredSbigMovies = applyFilters(sbigMovies, rankSelection, submitterSelection);
          chunkedSbigMovies = chunkArray(filteredSbigMovies, numberOfResults);
        }
        else {
          // Handle multi-select Rank filter.
          rankSelection = i.values;
          const filteredSbigMovies = applyFilters(sbigMovies, rankSelection, submitterSelection);
          totalMovies = filteredSbigMovies.length;
          chunkedSbigMovies = chunkArray(filteredSbigMovies, numberOfResults);
        }
        currentPageNo = 0;
        embedsArray = await updateCurrentPageAndEmbeds(currentPageNo, chunkedSbigMovies, interaction);
        i.update({ content: `Total Movies: ${totalMovies}\n ${currentPageNo + 1}/${chunkedSbigMovies.length}`, embeds: embedsArray.map(embed => embed.toJSON()) });
      } catch (error) {
        logToDevChannel(interaction.client, `Error in rankFilterAndNumberOfResultsCollector ${String(error)}`);
        await i.reply({ content: 'An error occurred while processing your request. Please try again later.', ephemeral: true });
      }
    });

    submitterFilterCollector.on('collect', async i => {
      try {
        submitterSelection = i.values;

        const filteredSbigMovies = applyFilters(sbigMovies, rankSelection, submitterSelection);
        totalMovies = filteredSbigMovies.length;
        chunkedSbigMovies = chunkArray(filteredSbigMovies, numberOfResults);
        currentPageNo = 0;
        embedsArray = await updateCurrentPageAndEmbeds(currentPageNo, chunkedSbigMovies, interaction);

        i.update({ content: `Total Movies: ${totalMovies}\n ${currentPageNo + 1}/${chunkedSbigMovies.length}`, embeds: embedsArray.map(embed => embed.toJSON()) });
      } catch (error) {
        logToDevChannel(interaction.client, String(error));
        await i.reply({ content: 'An error occurred while processing your request. Please try again later.', ephemeral: true });
      }
    });
  } catch (error) {
    logToDevChannel(interaction.client, String(error));
  }
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const results = [];
  while (array.length) {
    results.push(array.splice(0, chunkSize));
  }
  return results;
}

async function updateCurrentPageAndEmbeds(currentPageNo: number, chunkedSbigMovies: MovieData[][], interaction: ChatInputCommandInteraction) {
  const embedsArray = [];
  if (chunkedSbigMovies.length > 0) {
    const currentPage = chunkedSbigMovies[currentPageNo];
    for (const movie of currentPage) {
      embedsArray.push(createMovieSummaryEmbed(movie, await interaction.client.users.fetch(movie.sbigSubmitter)));
    }
  }

  return embedsArray;
}

function applyFilters(allMovies: MovieData[], rankSelection: string[], submitterSelection: string[]): MovieData[] {
  let filteredSbigMovies = allMovies.slice();

  if (rankSelection.length > 0) {
    filteredSbigMovies = filteredSbigMovies.filter(movie => rankSelection.includes(movie.sbigRank));
  }

  if (submitterSelection.length > 0) {
    filteredSbigMovies = filteredSbigMovies.filter(movie => submitterSelection.includes(movie.sbigSubmitter));
  }

  return filteredSbigMovies;
}