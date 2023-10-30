import { Client, GuildMember, Message, TextChannel } from 'discord.js';

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

export function createEmbedValueString(voteResults: Map<string, Array<string>>, vote: string): string {
	const voters = voteResults.get(vote);
	if (voters) {
		return `${voters.map((id) => `${id}`).join(', ')}`;
	}
	else {
		return 'No votes';
	}
}

export function createEmbedNameString(voteResults: Map<string, Array<string>>, vote: string): string {
	const voters = voteResults.get(vote);
	if (voters) {
		return `${vote} - ${voters.length}`;
	}
	else {
		return vote;
	}
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
	case ('👑'): return 5;
	case ('A'): return 4;
	case ('B'): return 3;
	case ('C'): return 2;
	case ('D'): return 1;
	case ('\uD83D\uDC80'): return 0;
	default: return 0;
	}
}

function getKeyByWeight(key: number): string {
	switch (key) {
	case (5): return '👑';
	case (4): return 'A';
	case (3): return 'B';
	case (2): return 'C';
	case (1): return 'D';
	case (0): return '\uD83D\uDC80';
	default: return 'Does Not Compute';
	}
}

