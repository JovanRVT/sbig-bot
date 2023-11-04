import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { MovieData, SlashCommand } from '../../types';
import { convertUserSelectionsToVotingResults, createVotingResultsEmbed, createMovieDetailsEmbed } from '../../utils';
import { omdbHandler } from '../../api/omdb';

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
    if (movie != '') {
      try {
        movieData = await omdbHandler(movie);
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

    const sButton = new ButtonBuilder()
      .setCustomId('👑')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('👑');

    const aButton = new ButtonBuilder()
      .setCustomId('A')
      .setStyle(ButtonStyle.Primary)
      .setLabel('A');

    const bButton = new ButtonBuilder()
      .setCustomId('B')
      .setStyle(ButtonStyle.Primary)
      .setLabel('B');

    const cButton = new ButtonBuilder()
      .setCustomId('C')
      .setStyle(ButtonStyle.Primary)
      .setLabel('C');

    const dButton = new ButtonBuilder()
      .setCustomId('D')
      .setStyle(ButtonStyle.Primary)
      .setLabel('D');

    const fButton = new ButtonBuilder()
      .setCustomId('F')
      .setStyle(ButtonStyle.Primary)
      .setLabel('F');

    const skullButton = new ButtonBuilder()
      .setCustomId('\uD83D\uDC80')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('\uD83D\uDC80');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(sButton);
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(aButton, bButton);
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(cButton, dButton, fButton);
    const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(skullButton);

    try {
      const response = await interaction.reply({ content: `${prompt} \nTime to Vote: ${minutes} minutes from start time`, components: [row, row1, row2, row3], embeds: embedsArray.map(embed => embed.toJSON()) });
      const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: milliseconds });

      collector.on('collect', async i => {
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

      collector.on('end', () => {
        const resultsEmbed = createVotingResultsEmbed(userSelections, convertUserSelectionsToVotingResults(userSelections), 'Voting has Ended!');
        if (movie != '') {
          embedsArray = [movieEmbed, resultsEmbed];
        }
        else {
          embedsArray = [resultsEmbed];
        }
        interaction.editReply({ content: `${prompt}`, embeds: embedsArray.map(embed => embed.toJSON()), components: [] });
      });
    }
    catch (error) {
      console.error(error);
    }
  },
};
