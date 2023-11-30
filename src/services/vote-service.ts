import { TierListEntry } from '../lib/tier-list-entry';
import { SubmitterStats, Tier } from '../types';

export function calculateResults(voteResults: Map<string, Array<string>>): Tier {
	let sum = 0;
	voteResults.forEach((value, key) => {
		sum += getWeightByTier(key);

	});
	const average = sum / voteResults.size;
	return getTierByWeight(Math.round(average));
}

export function getWeightByTier(key: string): number {
	switch (key) {
	case (Tier.S): return 6;
	case (Tier.A): return 5;
	case (Tier.B): return 4;
	case (Tier.C): return 3;
	case (Tier.D): return 2;
	case (Tier.F): return 1;
	case (Tier.Skull): return 0;
	default: return 0;
	}
}

export function getTierByWeight(key: number): Tier {
	switch (key) {
	case (6): return Tier.S;
	case (5): return Tier.A;
	case (4): return Tier.B;
	case (3): return Tier.C;
	case (2): return Tier.D;
	case (1): return Tier.F;
	case (0): return Tier.Skull;
	default: return Tier.Skull;
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

export function convertVotingResultsToUserSelections(votingResults: Map<string, string[]>): Map<string, string> {
	const userSelections = new Map<string, string>();

	votingResults.forEach((users, vote) => {
		users.forEach((user) => {
			userSelections.set(user, vote);
		});
	});

	return userSelections;
}

export function calculateAverageVote<T>(tierListEntries: TierListEntry<T>[]): string {
	let sum = 0;
	tierListEntries.forEach((value) => {
		sum += getWeightByTier(value.tier);

	});
	const average = sum / tierListEntries.length;
	return `${average.toPrecision(3)} (${getTierByWeight(Math.round(average))})`;
}

export function calculatePlayerRankings<T>(tierListEntries: TierListEntry<T>[]): SubmitterStats[] {
	// Group tierListEntries by submitter
    const groupedTierListEntries = tierListEntries.reduce((grouped, tierListEntry) => {
        (grouped[tierListEntry.submitter] = grouped[tierListEntry.submitter] || []).push(tierListEntry);
        return grouped;
    }, {} as Record<string, TierListEntry<T>[]>);

    // For each submitter, calculate total submissions, average rank, and total score
    const submitterStats = new Array<SubmitterStats>();
    for (const submitter in groupedTierListEntries) {
        const entriesByThisSubmitter = groupedTierListEntries[submitter];
        const totalSubmissions = entriesByThisSubmitter.length;
        const averageSubmissionScore = (entriesByThisSubmitter.reduce((sum, movie) => sum + getWeightByTier(movie.tier), 0) / totalSubmissions).toPrecision(3);
        const totalScore = entriesByThisSubmitter.reduce((sum, movie) => sum + getWeightByTier(movie.tier), 0);

        submitterStats.push({ submitter: submitter, totalSubmissions, averageSubmissionScore, totalScore });
    }

    // Sort by totalScore
    submitterStats.sort((a, b) => b.totalScore - a.totalScore);
	return submitterStats;
}