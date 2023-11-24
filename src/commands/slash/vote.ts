import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ComponentType, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { MovieData, SlashCommand } from '../../types';
import { omdbHandler } from '../../api/omdb';
import { upsertMovie } from '../../services/crud-service';
import { createSaveModal } from '../../utils/discord-utils';
import { createMovieDetailsEmbed } from '../../utils/discord-utils';
import { calculateResults, convertUserSelectionsToVotingResults, convertVoteResultsStringToMap, convertVotingResultsToUserSelections } from '../../services/vote-service';
import { createVotingResultsEmbed } from '../../utils/discord-utils';
import { createVoteButtonActionRows } from '../../utils/discord-utils';
import { logToDevChannel } from '../../utils/utils';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('vote')
    .setDescription('Triggers a ranking vote. Available for up to 15 minutes.')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Rank Category for the vote to be saved')
        .setRequired(true)
        .addChoices(
          { name: 'SBIGMovies', value: 'sbigMovies' },
          { name: 'Anime', value: 'anime' },
        )
      )
    .addStringOption(option =>
      option.setName('movie')
        .setDescription('Movie Title, IMDB link, or IMDB ID (e.g. tt0130236)')
        .setRequired(false)
    )
    .addUserOption(option =>
      option.setName('submitter')
        .setDescription('Person who is responsible for the movie submission. (Default is yee who hath invoked /vote)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('Text to display above the vote. (Default is \'What is the ranking for this movie?\')')
        .setRequired(false)
    ),
  async execute(interaction) {

    /* Pull user options - start */

    // Map to enforce a single selection per user
    let userSelections = new Map<string, string>();
    let initialResultsEmbed = createVotingResultsEmbed(convertUserSelectionsToVotingResults(userSelections), 'Voting has Started!');
    let embedsArray = [initialResultsEmbed];

    // Pull input category
    let category = 'SBIGMovies';
    const categoryOption = interaction.options.get('category')?.value;
    if (categoryOption) {
      category = categoryOption as string;
    }

    // Pull input submitter
    const submitterOption = interaction.options.get('submitter');
    let submitter = interaction.user;
    if (submitterOption && submitterOption.user) {
      submitter = submitterOption.user;
    }

    // Pull input movie
    const movieOption = interaction.options.get('movie');
    let movie = (movieOption && typeof movieOption.value === 'string') ? movieOption.value : '';
    let movieData: MovieData;
    let movieEmbed: EmbedBuilder;

    // Pull input prompt
    let defaultPrompt = 'What is the ranking for this movie?';
    const currentDate = new Date();
    const dateString = (currentDate.getMonth() + 1) + '/' + currentDate.getDate() + '/' + currentDate.getFullYear();
    if (movie != '') {
      try {
        movieData = await omdbHandler(movie);
        movieData.sbigSubmitter = submitter.id;
        movieData.sbigWatchedDate = dateString;
        defaultPrompt = `What is the ranking for ${movieData.title}?`;
        movieEmbed = createMovieDetailsEmbed(movieData, submitter);

        // Display previous voting results
        if (movieData.sbigVoteResults !== '') {
          userSelections = convertVotingResultsToUserSelections(convertVoteResultsStringToMap(movieData.sbigVoteResults));
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
          movieData.sbigVoteResults = JSON.stringify(Object.fromEntries(voteResults), null, '\n').replace(/\n\n/g, '\n');
          movieData.sbigRank = calculateResults(voteResults);
        }
        else {
          embedsArray = [resultsEmbed];
        }
        interaction.editReply({ content: `${prompt}`, embeds: embedsArray.map(embed => embed.toJSON()), components: [] });
        saveActions(interaction, movieData, category);
      });
    }
    catch (error) {
      logToDevChannel(interaction.client, String(error));
      console.error(error);
    }
  },
};

async function saveActions(interaction: ChatInputCommandInteraction, movieData:MovieData, category:string) {
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
        const savedMovieData = await createSaveModal(i, movieData);
        upsertMovie(savedMovieData, `${category}.json`);
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

