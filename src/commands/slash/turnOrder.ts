import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../../types';
import fs from 'fs';

type TurnOrderItem = {
  id: string;
  name: string;
  isTurn: boolean;
};

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
		.setName('turnorder')
		.setDescription('Turn order for bad movie selection.'),
	async execute(interaction) {
    // Read the current turn order
    const raw = fs.readFileSync('turnOrder.json', 'utf8');
    const turnOrder:TurnOrderItem[] = JSON.parse(raw);

    let replyContent = 'The current turn order is: ';
    let currentPos = 0;
    let activePos = 0;
    turnOrder.forEach((turnOrderItem) => {
      replyContent += `\n <@${turnOrderItem.id}>`;
      if (turnOrderItem.isTurn) {
        replyContent += ' - ✅';
        activePos = currentPos;
      }
      currentPos++;
    });

    const nextButton = new ButtonBuilder()
      .setCustomId('Next')
      .setLabel('Next')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(nextButton);

    const response = await interaction.reply({ content:`${replyContent}`, components: [row] });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

    collector.on('collect', async i => {
      // Increase the turn position
      if (activePos < turnOrder.length - 1) {
        activePos++;
      }
      else {
        activePos = 0;
      }
      currentPos = 0;

      // Clear the previous isTurn and set the next before saving back to file
      replyContent = 'The current turn order is: ';
      turnOrder.forEach((turnOrderItem) => {
        replyContent += `\n <@${turnOrderItem.id}>`;
        if (currentPos == activePos) {
          replyContent += ' - ✅';
          turnOrderItem.isTurn = true;
        }
        else {
          turnOrderItem.isTurn = false;
        }
        currentPos++;
      });

      // Write the new turn order back to the file
      fs.writeFileSync('turnOrder.json', JSON.stringify(turnOrder));
      await i.reply({ content:'Turn order updated', ephemeral: true });
      await interaction.editReply({ content:`${replyContent}` });
    });

    collector.on('end', () => {
      interaction.editReply({ content:`${replyContent}`, components: [] });
    });
  },
};
