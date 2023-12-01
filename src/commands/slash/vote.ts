import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ComponentType, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../../types';
import { omdbHandler } from '../../services/omdb-service';
import { createMovieDetailsEmbed, createSaveModal, createVotingResultsEmbed, createVoteButtonActionRows } from '../../utils/discord-utils';
import { calculateResults, convertUserSelectionsToVotingResults, convertVotingResultsToUserSelections } from '../../services/vote-service';
import { logToDevChannel } from '../../utils/utils';
import { OmdbData } from '../../lib/omdb-data';
import { TierListEntry } from '../../lib/tier-list-entry';
import { Op } from 'sequelize';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('vote')
    .setDescription('Triggers a ranking vote. Available for up to 15 minutes.')
    .addStringOption(option =>
      option.setName('movie')
        .setDescription('Movie Title, IMDB link, or IMDB ID (e.g. tt0130236)')
        .setRequired(false)
    )
    .addUserOption(option =>
      option.setName('submitter')
        .setDescription('Person who is responsible for the submission. (Default is yee who hath invoked /vote)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('Text to display above the vote. (Default is \'Which Tier does this movie belong in?\')')
        .setRequired(false)
    ),
  async execute(interaction) {

    /* Pull user options - start */

    // Map to enforce a single selection per user
    let userSelections = new Map<string, string>();
    let initialResultsEmbed = createVotingResultsEmbed(convertUserSelectionsToVotingResults(userSelections), 'Voting has Started!');
    let embedsArray = [initialResultsEmbed];

    // Pull input submitter
    const submitterOption = interaction.options.get('submitter');
    let submitter = interaction.user;
    if (submitterOption && submitterOption.user) {
      submitter = submitterOption.user;
    }

    // Pull input movie
    const movieOption = interaction.options.get('movie');
    let movie = (movieOption && typeof movieOption.value === 'string') ? movieOption.value : '';
    let movieData: OmdbData;
    let movieEmbed: EmbedBuilder;

    let tierListEntry = TierListEntry.build({ guildId: interaction.guildId, notes: '' }) as TierListEntry<OmdbData>;

    // Pull input prompt
    let defaultPrompt = 'What is the ranking for this movie?';
    if (movie != '') {
      try {
        movieData = await omdbHandler(movie);

        // Check if already exists
        const dbResponse = await TierListEntry.findOne({ where: {
           externalDataId:{ [Op.eq]:movieData.imdbId },
            guildId: { [Op.eq]: interaction.guildId },
           },
        }) as TierListEntry<OmdbData> | null;


        if (!dbResponse) {
          // New Movie
          tierListEntry.submitter = submitter.id;
          tierListEntry.externalData = movieData;
          tierListEntry.externalDataId = movieData.imdbId;
        }
        else {
          tierListEntry = dbResponse;
        }

        defaultPrompt = `Which Tier does ${movieData.title} belong in?`;
        movieEmbed = createMovieDetailsEmbed(movieData, submitter, tierListEntry.notes);

        // Display previous voting results
        if (tierListEntry.voteResults !== null && tierListEntry.voteResults !== undefined && tierListEntry.voteResults.size > 0) {
          userSelections = convertVotingResultsToUserSelections(tierListEntry.voteResults);
          initialResultsEmbed = createVotingResultsEmbed(convertUserSelectionsToVotingResults(userSelections), 'Voting has Started!');
        }

        embedsArray = [movieEmbed, initialResultsEmbed];
      } catch (error) {
        movie = '';
        console.error(error);
        logToDevChannel(interaction.client, String(error));
      }
    }
    const promptOption = interaction.options.get('prompt');
    const prompt = (promptOption && typeof promptOption.value === 'string') ? promptOption.value : defaultPrompt;

    /* Pull user options - end */

    const defaultMinutes = 15;
    const milliseconds = defaultMinutes * 60 * 1000;
    const actionRows = createVoteButtonActionRows();

    try {
      const response = await interaction.reply({ content: `${prompt} \nTime to Vote: ${defaultMinutes} minutes from start time`, components: actionRows, embeds: embedsArray.map(embed => embed.toJSON()) });
      const voteCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: milliseconds });

      voteCollector.on('collect', async i => {
        const selection = i.customId;

        if (selection == 'End') {
          voteCollector.stop();
          return;
        }

        userSelections.set(i.user.id, selection);

        const currentResultsEmbed = createVotingResultsEmbed(convertUserSelectionsToVotingResults(userSelections), 'Voting is Live!');
        if (movie != '') {
          embedsArray = [movieEmbed, currentResultsEmbed];
        }
        else {
          embedsArray = [currentResultsEmbed];
        }
        interaction.editReply({ embeds: embedsArray.map(embed => embed.toJSON()) });
        await i.reply({ content: `You selected ${selection}!`, ephemeral: true });
      });

      voteCollector.on('end', () => {
        const voteResults = convertUserSelectionsToVotingResults(userSelections);
        const resultsEmbed = createVotingResultsEmbed(voteResults, 'Voting has Ended!');
        if (movie != '') {
          embedsArray = [movieEmbed, resultsEmbed];
          tierListEntry.voteResults = voteResults;
          tierListEntry.tier = calculateResults(voteResults);
        }
        else {
          embedsArray = [resultsEmbed];
        }
        interaction.editReply({ content: `${prompt}`, embeds: embedsArray.map(embed => embed.toJSON()), components: [] });
        saveActions(interaction, tierListEntry);
      });
    }
    catch (error) {
      logToDevChannel(interaction.client, String(error));
      console.error(error);
    }
  },
};

async function saveActions<T>(interaction: ChatInputCommandInteraction, tierListEntry:TierListEntry<T>) {
  try {
    const saveButton = new ButtonBuilder()
    .setCustomId('Save')
    .setStyle(ButtonStyle.Success)
    .setLabel('Save');

    const cancelButton = new ButtonBuilder()
    .setCustomId('Cancel')
    .setStyle(ButtonStyle.Danger)
    .setLabel('Cancel');

    const saveButtonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(saveButton, cancelButton);

    const saveResponse = await interaction.editReply({ content: 'Would you like to save this result?', components: [saveButtonRow] });
    const collector = saveResponse.createMessageComponentCollector({ componentType: ComponentType.Button, time: 900000 });
    collector.on('collect', async i => {
      if (i.customId === 'Save') {
        createSaveModal(i, tierListEntry).then((savedTierListData) => {
          savedTierListData.save();
        });
        i.update({ content: 'Result Saved!', components: [] });
        collector.stop();
      }
      else if (i.customId === 'Cancel') {
        i.update({ content: 'Result Not Saved!', components: [] });
        collector.stop();
      }
    });
  }
  catch (error) {
    logToDevChannel(interaction.client, String(error));
    console.error(error);
  }
}

