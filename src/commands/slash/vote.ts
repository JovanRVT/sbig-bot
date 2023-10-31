import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../../types';
import { convertUserSelectionsToVotingResults, createVotingResultsEmbed } from '../../utils';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
		.setName('vote')
		.setDescription('Triggers a ranking vote.'),
	async execute(interaction) {

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
    const response = await interaction.reply({ content:'What is the ranking for this movie? ', components: [row, row1, row2, row3] });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

    // Map to enforce a single selection per user
    const userSelections = new Map<string, string>();

    collector.on('collect', async i => {
      const selection = i.customId;
      userSelections.set(i.user.id, selection);

      const currentResultsEmbed = createVotingResultsEmbed(userSelections, convertUserSelectionsToVotingResults(userSelections), 'Voting is Live!');

      interaction.editReply({ embeds:[currentResultsEmbed] });
      await i.reply({ content:`You selected ${selection}!`, ephemeral: true });
    });

    collector.on('end', () => {
      const resultsEmbed = createVotingResultsEmbed(userSelections, convertUserSelectionsToVotingResults(userSelections), 'Voting has Ended!');
      interaction.editReply({ embeds: [resultsEmbed], components: [] });
    });
  },
};
