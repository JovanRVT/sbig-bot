import { ChatInputCommandInteraction, ComponentType, SlashCommandBuilder, User, hyperlink } from 'discord.js';
import { SlashCommand } from '../../types';
import { createPaginationButtonActionRow as createPaginationButtonActionRow, createTierListEntrySummaryEmbed, createPlayerSummaryEmbed, createTierListSummaryEmbed, createSelectMenus } from '../../utils/discord-utils';
import { calculatePlayerRankings, getWeightByTier } from '../../services/vote-service';
import { logToDevChannel } from '../../utils/utils';
import { TierListEntry } from '../../lib/tier-list-entry';
import { Op } from 'sequelize';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('List the Tiers for a category (SBIGMovies by default)')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Rank Category for the vote to be saved')
        .setRequired(false)
      )
    .addBooleanOption(option =>
      option
        .setName('interactive')
        .setDescription('Enable interactive (tier list entry summary with pagination and filters) viewing of the Tier List')
        .setRequired(false))
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to filter by. Does not apply to interactive.')
        .setRequired(false)),
  async execute(interaction) {
    try {
      // Pull input category
      let category = 'SBIGMovies';
      const categoryOption = interaction.options.get('category')?.value;
      if (categoryOption) {
        category = categoryOption as string;
      }

      let tierListEntries = await TierListEntry.findAll({
        where: {
          guildId: { [Op.eq]: interaction.guildId },
          category: { [Op.eq]: category },
        },
      });

      // Pull input submitter
      const submitterOption = interaction.options.get('user');
      let submitter: User | null = null;
      if (submitterOption && submitterOption.user) {
        submitter = submitterOption.user;
      }

      if (interaction.options.get('interactive')) {
        await handleInteractiveTierList(interaction, tierListEntries);
      }
      else {
        let title = category + ' Rankings';
        if (submitter !== null) {
          tierListEntries = tierListEntries.filter(tierListEntry => tierListEntry.submitter === submitter?.id);
          title += ` for ${submitter.displayName}`;
        }

        const tierListSummaryEmbed = createTierListSummaryEmbed(tierListEntries, title);
        const playerRankingEmbed = createPlayerSummaryEmbed(calculatePlayerRankings(tierListEntries));
        const embedsArray = [tierListSummaryEmbed, playerRankingEmbed];

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

async function handleInteractiveTierList<T>(interaction: ChatInputCommandInteraction, tierListEntries: TierListEntry<T>[]) {
  try {
    tierListEntries.sort((a, b) => getWeightByTier(b.tier) - getWeightByTier(a.tier));
    let numberOfResults = 3;
    let chunkedTierLists = chunkArray(tierListEntries.slice(), numberOfResults);
    let currentPageNo = 0;
    let totalEntries = tierListEntries.length;
    let embedsArray = await updateCurrentPageAndEmbeds(currentPageNo, chunkedTierLists, interaction);
    let submitterSelection: string[] = [];
    let tierSelection: string[] = [];

    const paginationRow = createPaginationButtonActionRow();
    const selectMenuRow = createSelectMenus();

    const interactionResponse = await interaction.reply({ content: `Total Entries: ${tierListEntries.length}\n${currentPageNo + 1}/${chunkedTierLists.length}`, embeds: embedsArray.map(embed => embed.toJSON()), components: [paginationRow, ...selectMenuRow.map(row => row.toJSON())] });

    const rankFilterAndNumberOfResultsCollector = interactionResponse.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 900000 });
    const submitterFilterCollector = interactionResponse.createMessageComponentCollector({ componentType: ComponentType.UserSelect, time: 900000 });
    const paginationCollector = interactionResponse.createMessageComponentCollector({ componentType: ComponentType.Button, time: 900000 });

    paginationCollector.on('collect', async i => {
      try {
        const selection = i.customId;
        if (selection === 'Next') {
          if (currentPageNo >= chunkedTierLists.length - 1) {
            currentPageNo = 0;
          }
          else {
            currentPageNo++;
          }
        } else if (selection === 'Prev') {
          if (currentPageNo <= 0) {
            currentPageNo = chunkedTierLists.length - 1;
          }
          else {
            currentPageNo--;
          }
        } else if (selection === 'Last') {
          currentPageNo = chunkedTierLists.length - 1;
        } else if (selection === 'First') {
          currentPageNo = 0;
        } else if (selection === 'Stop') {
          paginationCollector.stop();
          i.reply({ content: 'Interactive Session Ended.', ephemeral: true });
          return;
        }

        embedsArray = await updateCurrentPageAndEmbeds(currentPageNo, chunkedTierLists, interaction);
        i.update({ content: `Total Entries: ${totalEntries}\n ${currentPageNo + 1}/${chunkedTierLists.length}`, embeds: embedsArray.map(embed => embed.toJSON()) });
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
          const filteredTierListEntries = applyFilters(tierListEntries, tierSelection, submitterSelection);
          chunkedTierLists = chunkArray(filteredTierListEntries, numberOfResults);
        }
        else {
          // Handle multi-select Rank filter.
          tierSelection = i.values;
          const filteredTierListEntries = applyFilters(tierListEntries, tierSelection, submitterSelection);
          totalEntries = filteredTierListEntries.length;
          chunkedTierLists = chunkArray(filteredTierListEntries, numberOfResults);
        }
        currentPageNo = 0;
        embedsArray = await updateCurrentPageAndEmbeds(currentPageNo, chunkedTierLists, interaction);
        i.update({ content: `Total Entries: ${totalEntries}\n ${currentPageNo + 1}/${chunkedTierLists.length}`, embeds: embedsArray.map(embed => embed.toJSON()) });
      } catch (error) {
        logToDevChannel(interaction.client, `Error in rankFilterAndNumberOfResultsCollector ${String(error)}`);
        await i.reply({ content: 'An error occurred while processing your request. Please try again later.', ephemeral: true });
      }
    });

    submitterFilterCollector.on('collect', async i => {
      try {
        submitterSelection = i.values;

        const filteredTierListEntries = applyFilters(tierListEntries, tierSelection, submitterSelection);
        totalEntries = filteredTierListEntries.length;
        chunkedTierLists = chunkArray(filteredTierListEntries, numberOfResults);
        currentPageNo = 0;
        embedsArray = await updateCurrentPageAndEmbeds(currentPageNo, chunkedTierLists, interaction);

        i.update({ content: `Total Entries: ${totalEntries}\n ${currentPageNo + 1}/${chunkedTierLists.length}`, embeds: embedsArray.map(embed => embed.toJSON()) });
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

async function updateCurrentPageAndEmbeds<T>(currentPageNo: number, chunkedTierListEntries: TierListEntry<T>[][], interaction: ChatInputCommandInteraction) {
  const embedsArray = [];
  if (chunkedTierListEntries.length > 0) {
    const currentPage = chunkedTierListEntries[currentPageNo];
    for (const tierListEntry of currentPage) {
      embedsArray.push(createTierListEntrySummaryEmbed(tierListEntry, await interaction.client.users.fetch(tierListEntry.submitter)));
    }
  }

  return embedsArray;
}

function applyFilters<T>(allTierListEntries: TierListEntry<T>[], tierSelection: string[], submitterSelection: string[]): TierListEntry<T>[] {
  let filteredTierListEntries = allTierListEntries.slice();

  if (tierSelection.length > 0) {
    filteredTierListEntries = filteredTierListEntries.filter(tierListEntry => tierSelection.includes(tierListEntry.tier));
  }

  if (submitterSelection.length > 0) {
    filteredTierListEntries = filteredTierListEntries.filter(tierListEntry => submitterSelection.includes(tierListEntry.submitter));
  }

  return filteredTierListEntries;
}