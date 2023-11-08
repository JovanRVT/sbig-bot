import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ComponentType, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { MovieData, SlashCommand } from '../../types';
import { omdbHandler } from '../../api/omdb';
import { upsertMovie, createSaveModal } from '../../services/crud-service';
import { createMovieDetailsEmbed } from '../../services/movie-service';
import { createVotingResultsEmbed, createVoteButtonActionRows, calculateResults, convertUserSelectionsToVotingResults } from '../../services/vote-service';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('vote')
    .setDescription('Triggers a ranking vote.')
    .addNumberOption(option =>
      option.setName('duration')
        .setDescription('Amount of time in minutes before vote closes (Default is 2 min).')
        .setRequired(false)
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
    const userSelections = new Map<string, string>();
    const emptyResultsEmbed = createVotingResultsEmbed(userSelections, convertUserSelectionsToVotingResults(userSelections), 'Voting has Started!');
    let embedsArray = [emptyResultsEmbed];

    // Pull input duration
    const defaultMinutes = 2;
    const durationOption = interaction.options.get('duration');
    const minutes = (durationOption && typeof durationOption.value === 'number') ? durationOption.value : defaultMinutes;
    const milliseconds = minutes * 60 * 1000;

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
        embedsArray = [movieEmbed, emptyResultsEmbed];
      } catch (error) {
        movie = '';
        console.error(error);
        embedsArray = [emptyResultsEmbed];
      }
    }
    const promptOption = interaction.options.get('prompt');
    const prompt = (promptOption && typeof promptOption.value === 'string') ? promptOption.value : defaultPrompt;

    /* Pull user options - end */

    const actionRows = createVoteButtonActionRows();

    try {
      const response = await interaction.reply({ content: `${prompt} \nTime to Vote: ${minutes} minutes from start time`, components: actionRows, embeds: embedsArray.map(embed => embed.toJSON()) });
      const voteCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: milliseconds });

      voteCollector.on('collect', async i => {
        const selection = i.customId;
        userSelections.set(i.user.id, selection);

        const currentResultsEmbed = createVotingResultsEmbed(userSelections, convertUserSelectionsToVotingResults(userSelections), 'Voting is Live!');
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
        const resultsEmbed = createVotingResultsEmbed(userSelections, convertUserSelectionsToVotingResults(userSelections), 'Voting has Ended!');
        if (movie != '') {
          embedsArray = [movieEmbed, resultsEmbed];
          movieData.sbigVoteResults = JSON.stringify(Object.fromEntries(voteResults), null, '\n').replace(/\n\n/g, '\n');
          movieData.sbigRank = calculateResults(voteResults);
        }
        else {
          embedsArray = [resultsEmbed];
        }
        interaction.editReply({ content: `${prompt}`, embeds: embedsArray.map(embed => embed.toJSON()), components: [] });
        saveFollowUpActions(interaction, movieData);
      });
    }
    catch (error) {
      console.error(error);
    }
  },
};

async function saveFollowUpActions(interaction: ChatInputCommandInteraction, movieData:MovieData) {
  try {
    const saveButton = new ButtonBuilder()
    .setCustomId('Save')
    .setStyle(ButtonStyle.Success)
    .setLabel('Save');

    const noButton = new ButtonBuilder()
    .setCustomId('No')
    .setStyle(ButtonStyle.Danger)
    .setLabel('No');

    const followUpButtonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(saveButton, noButton);

    const followUpResponse = await interaction.followUp({ content: 'Would you like to save this result?', components: [followUpButtonRow] });
    const collector = followUpResponse.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });
    collector.on('collect', async i => {
      if (i.customId === 'Save') {
        const savedJsonString = await createSaveModal(i, JSON.stringify(movieData, null, '\n').replace(/\n\n/g, '\n'));
        const savedJson:MovieData = JSON.parse(savedJsonString);
        upsertMovie(savedJson, 'sbigMovies.json');
        i.editReply({ content: `Result saved: \n${savedJson}`, components: [] });
        collector.stop();
      }
      else {
        collector.stop();
      }
    });
  }
  catch (error) {
    console.error(error);
  }
}

