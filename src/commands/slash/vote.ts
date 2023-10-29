import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, MessageReaction, SlashCommandBuilder, User } from 'discord.js';
import { SlashCommand } from '../../types';
import { calculateResults, createEmbedNameString, createEmbedValueString } from '../../utils';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
		.setName('vote')
		.setDescription('Triggers a ranking vote for the movie.'),
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
      .setCustomId('\uD83D\uDC80')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('\uD83D\uDC80');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(sButton);
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(aButton, bButton);
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(cButton, dButton);
    const row3 =  new ActionRowBuilder<ButtonBuilder>().addComponents(fButton);
    const response = await interaction.reply({ content:'What is the ranking for this movie? ',components: [row, row1, row2, row3] });

    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 });

    let userSelections = new Map();

    collector.on('collect', async i => {
      const selection = i.customId;
      const user = i.user;

      userSelections.set(user, selection);

      await i.reply(`${i.user} has selected ${selection}!`);
    });

    collector.on('end', collected => {
      let resultsMessage = '';

      let voteResults = new Map<String,Array<String>>();

      userSelections.forEach((vote, user) => {
        let usersForVote = voteResults.get(vote);
        if (usersForVote) {
          usersForVote.push(user);
        } else {
          voteResults.set(vote, [user]);
        }
      });

      // inside a command, event listener, etc.
      const exampleEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('What is the ranking for this movie?')
        // .setAuthor({ name: 'Some name', iconUR   L: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
        .setDescription(`Voting has ended! Here are the results:`)
        // .setThumbnail('https://i.imgur.com/AfFp7pu.png')
        .addFields(
          { name: `${createEmbedNameString(voteResults,'👑')}`, value: `${createEmbedValueString(voteResults,'👑')}`, inline: true },
          { name: `${createEmbedNameString(voteResults,'A')}`, value: `${createEmbedValueString(voteResults,'A')}`, inline: true },
          { name: `${createEmbedNameString(voteResults,'B')}`, value: `${createEmbedValueString(voteResults,'B')}`, inline: true },
          { name: `${createEmbedNameString(voteResults,'C')}`, value: `${createEmbedValueString(voteResults,'C')}`, inline: true },
          { name: `${createEmbedNameString(voteResults,'D')}`, value: `${createEmbedValueString(voteResults,'D')}`, inline: true },
          { name: `${createEmbedNameString(voteResults,'\uD83D\uDC80')}`, value: `${createEmbedValueString(voteResults,'\uD83D\uDC80')}`, inline: true },
          { name: 'Total Votes', value: `${userSelections.size}`},
          { name: 'Result', value: `${calculateResults(voteResults)}`},
        )
        // .setImage('https://i.imgur.com/AfFp7pu.png')
        .setTimestamp()
        .setFooter({ text: 'So Bad It\'s Good'});

      interaction.followUp({ embeds: [exampleEmbed] });
    });
  },
};
