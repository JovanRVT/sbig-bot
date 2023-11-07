import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

export function createVoteButtonActionRows(): ActionRowBuilder<ButtonBuilder>[] {
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

	return [row, row1, row2, row3];
}

export function calculateResults(voteResults: Map<string, Array<string>>): string {
	let sum = 0;
	voteResults.forEach((value, key) => {
		sum += getWeightByKey(key);

	});
	const average = sum / voteResults.size;
	return getKeyByWeight(Math.ceil(average));
}

function getWeightByKey(key: string): number {
	switch (key) {
	case ('👑'): return 6;
	case ('A'): return 5;
	case ('B'): return 4;
	case ('C'): return 3;
	case ('D'): return 2;
	case ('F'): return 1;
	case ('\uD83D\uDC80'): return 0;
	default: return 0;
	}
}

function getKeyByWeight(key: number): string {
	switch (key) {
	case (6): return '👑';
	case (5): return 'A';
	case (4): return 'B';
	case (3): return 'C';
	case (2): return 'D';
	case (1): return 'F';
	case (0): return '\uD83D\uDC80';
	default: return 'Does Not Compute';
	}
}

export function createVotingResultsEmbed(userSelections: Map<string, string>, voteResults:Map<string, Array<string>>, description: string) : EmbedBuilder {

	const currentResultsEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Result: ${calculateResults(voteResults)}`)
        .setDescription(description)
        // .setThumbnail('https://i.imgur.com/AfFp7pu.png')
        .addFields(
          { name: `${createEmbedNameString(voteResults, '👑')}`, value: `${createEmbedValueString(voteResults, '👑')}`, inline: true },
          { name: `${createEmbedNameString(voteResults, 'A')}`, value: `${createEmbedValueString(voteResults, 'A')}`, inline: true },
          { name: `${createEmbedNameString(voteResults, 'B')}`, value: `${createEmbedValueString(voteResults, 'B')}`, inline: true },
          { name: `${createEmbedNameString(voteResults, 'C')}`, value: `${createEmbedValueString(voteResults, 'C')}`, inline: true },
          { name: `${createEmbedNameString(voteResults, 'D')}`, value: `${createEmbedValueString(voteResults, 'D')}`, inline: true },
          { name: `${createEmbedNameString(voteResults, 'F')}`, value: `${createEmbedValueString(voteResults, 'F')}`, inline: true },
          { name: `${createEmbedNameString(voteResults, '\uD83D\uDC80')}`, value: `${createEmbedValueString(voteResults, '\uD83D\uDC80')}`, inline: true },
          { name: 'Total Votes', value: `${userSelections.size}` },
        )
        .setTimestamp()
        .setFooter({ text: 'So Bad It\'s Good' });

	return currentResultsEmbed;
}

function createEmbedValueString(voteResults: Map<string, Array<string>>, vote: string): string {
	const voters = voteResults.get(vote);
	if (voters) {
		return `${voters.map((id) => `<@${id}>`).join(', ')}`;
	}
	else {
		return 'No votes';
	}
}

function createEmbedNameString(voteResults: Map<string, Array<string>>, vote: string): string {
	const voters = voteResults.get(vote);
	if (voters) {
		return `${vote} - ${voters.length}`;
	}
	else {
		return vote;
	}
}

export function convertUserSelectionsToVotingResults(userSelections: Map<string, string>): Map<string, Array<string>> {
	const voteResults = new Map<string, Array<string>>();

	userSelections.forEach((vote, user) => {
	  const usersForVote = voteResults.get(vote);
	  if (usersForVote) {
		usersForVote.push(user);
	  } else {
		voteResults.set(vote, [user]);
	  }
	});

	return voteResults;
}