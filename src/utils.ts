import { Client, EmbedBuilder, GuildMember, Message, TextChannel } from 'discord.js';

const MOD_LOG_CHANNEL_ID =
  process.env.MOD_LOG_CHANNEL_ID ?? '763149438951882792';

const staffRoles = ['next.js', 'moderator', 'vercel'];

export const isStaff = (member: GuildMember | null | undefined): boolean => {
	if (!member) return false;

	return member.roles.cache.some((role) =>
		staffRoles.includes(role.name.toLowerCase())
	);
};

export const isJsOrTsFile = (file: string) =>
	file.endsWith('.ts') || file.endsWith('.js');

export const logAndDelete = async (
	client: Client,
	message: Message,
	reason: string
) => {
	const modLogChannel = client.channels.cache.get(
		MOD_LOG_CHANNEL_ID
	) as TextChannel;

	await modLogChannel.send({
		embeds: [
			{
				title: 'Message automatically deleted',
				description: '```' + message.content + '```',
				color: 16098851,
				fields: [
					{
						name: 'Author profile',
						value: `<@${message.author.id}>`,
						inline: true,
					},
					{
						name: 'Reason',
						value: reason,
						inline: true,
					},
					{
						name: 'Channel',
						value: `<#${message.channel.id}>`,
						inline: true,
					},
				],
			},
		],
	});

	message.delete();
};

type RemainingTime = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export const remainingTime = (
	startTime: number,
	endTime: number
): RemainingTime => {
	// https://stackoverflow.com/a/13904120
	// get total seconds between the times
	let delta = Math.abs(endTime - startTime) / 1000;

	// calculate (and subtract) whole days
	const days = Math.floor(delta / 86400);
	delta -= days * 86400;

	// calculate (and subtract) whole hours
	const hours = Math.floor(delta / 3600) % 24;
	delta -= hours * 3600;

	// calculate (and subtract) whole minutes
	const minutes = Math.floor(delta / 60) % 60;
	delta -= minutes * 60;

	// what's left is seconds (in theory the modulus is not required)
	const seconds = delta % 60;

	return { days, hours, minutes, seconds };
};

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

export function createVotingResultsEmbed(userSelections: Map<string, string>, voteResults:Map<string, Array<string>>, description: string) : EmbedBuilder {

	const currentResultsEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`Result: ${calculateResults(voteResults)}`)
        // .setAuthor({ name: 'Some name', iconUR   L: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
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
        // .setImage('https://i.imgur.com/AfFp7pu.png')
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

function calculateResults(voteResults: Map<string, Array<string>>): string {
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

