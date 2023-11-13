import { MovieData, SubmitterScores } from '../types';

export function calculateResults(voteResults: Map<string, Array<string>>): string {
	let sum = 0;
	voteResults.forEach((value, key) => {
		sum += getWeightByKey(key);

	});
	const average = sum / voteResults.size;
	return getKeyByWeight(Math.round(average));
}

export function getWeightByKey(key: string): number {
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

export function getKeyByWeight(key: number): string {
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

export function convertVoteResultsStringToMap(voteResults: string) : Map<string, string[]> {
	const voteResultsObject = JSON.parse(voteResults);
	return new Map(Object.entries(voteResultsObject));
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

export function calculateAverageVote(sbigMovies: MovieData[]): string {
	let sum = 0;
	sbigMovies.forEach((value) => {
		sum += getWeightByKey(value.sbigRank);

	});
	const average = sum / sbigMovies.length;
	return `${average.toPrecision(3)} (${getKeyByWeight(Math.round(average))})`;
}

export function calculatePlayerRankings(sbigMovies: MovieData[]): SubmitterScores[] {
	// Group movies by sbigSubmitter
    const groupedMovies = sbigMovies.reduce((grouped, movie) => {
        (grouped[movie.sbigSubmitter] = grouped[movie.sbigSubmitter] || []).push(movie);
        return grouped;
    }, {} as Record<string, MovieData[]>);

    // For each sbigSubmitter, calculate total submissions, average rank, and total score
    const submitterScores = new Array<SubmitterScores>();
    for (const sbigSubmitter in groupedMovies) {
        const moviesOfThisSubmitter = groupedMovies[sbigSubmitter];
        const totalSubmissions = moviesOfThisSubmitter.length;
        const averageRank = (moviesOfThisSubmitter.reduce((sum, movie) => sum + getWeightByKey(movie.sbigRank), 0) / totalSubmissions).toPrecision(3);
        const totalScore = moviesOfThisSubmitter.reduce((sum, movie) => sum + getWeightByKey(movie.sbigRank), 0);

        submitterScores.push({ sbigSubmitter, totalSubmissions, averageRank, totalScore });
    }

    // Sort by totalScore
    submitterScores.sort((a, b) => b.totalScore - a.totalScore);
	return submitterScores;
}