import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ComponentType, SlashCommandBuilder } from 'discord.js';
import { SlashCommand, TurnOrderItem } from '../../types';
import { CustomConfig } from '../../lib/custom-config';
import { Op } from 'sequelize';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
		.setName('turnorder')
		.setDescription('Manage Turn Order.')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Display Turn Order.'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add user to Turn Order')
        .addUserOption(option => option.setName('target').setDescription('The user')))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove user from Turn Order')
        .addUserOption(option => option.setName('target').setDescription('The user'))),
	async execute(interaction) {
    const subCommand = interaction.options.getSubcommand();

    if (subCommand === 'list') {
      listTurnOrder(interaction);
    }
    else if (subCommand === 'add') {
      const userToAdd = interaction.options.getUser('target')?.id;
      if (userToAdd) {
        addToTurnOrder(interaction, userToAdd);
      }
      else {
        interaction.reply({ content: 'Error, cannot find user' });
      }
    }
    else if (subCommand === 'remove') {
      const userToRemove = interaction.options.getUser('target')?.id;
      if (userToRemove) {
        removeFromTurnOrder(interaction, userToRemove);
      }
      else {
        interaction.reply({ content: 'Error, cannot find user' });
      }
    }
  },
};

async function listTurnOrder(interaction: ChatInputCommandInteraction) {
  // Read the current turn order
  const existingConfig = await CustomConfig.findOne({ where: { guildId: { [Op.eq]: interaction.guildId } } });
  const turnOrder:TurnOrderItem[] = existingConfig ? existingConfig.turnOrder : [];

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
    if (existingConfig) {
      existingConfig.changed('turnOrder', true);
      await existingConfig.save();
    }

    await i.update({ content:`${replyContent}` });
  });

  collector.on('end', () => {
    interaction.editReply({ content:`${replyContent}`, components: [] });
  });
}

async function addToTurnOrder(interaction: ChatInputCommandInteraction, userId: string) {
  const turnOrderItemToAdd: TurnOrderItem = { id: userId, isTurn: false };

  // Check if a config already exists
  const existingConfig = await CustomConfig.findOne({ where: {
     guildId: { [Op.eq]: interaction.guildId },
    },
  });

  if (existingConfig && existingConfig.turnOrder.some(item => item.id === userId)) {
    interaction.reply(`<@${userId}> already exists in turn order.`);
    return;
  }

  if (existingConfig) {
    existingConfig.turnOrder.push(turnOrderItemToAdd);
    existingConfig.changed('turnOrder', true);
    existingConfig.save();
  }
  else {
    // First turn order config
    turnOrderItemToAdd.isTurn = true;
    const newConfig = new CustomConfig({
      guildId: interaction.guildId,
      turnOrder: [turnOrderItemToAdd],
    });
    await newConfig.save();
  }
  interaction.reply(`<@${userId}> added to turn order`);
}

async function removeFromTurnOrder(interaction: ChatInputCommandInteraction, userId: string) {
  // Check if user exists in turn order
  const existingConfig = await CustomConfig.findOne({ where: {
    guildId: { [Op.eq]: interaction.guildId },
  } });

  if (existingConfig) {
    const index = existingConfig.turnOrder.findIndex(item => item.id === userId);
    if (index !== -1) {
      existingConfig.turnOrder.splice(index, 1);
      existingConfig.changed('turnOrder', true);
      existingConfig.save();
      interaction.reply(`<@${userId}> removed from turn order`);
    }
    else {
      interaction.reply(`<@${userId}> was not found in the turn order`);
    }
  }
}