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

export function convertVotingResultsToUserSelections(votingResults: Map<string,string[]>): Map<string,string> {
	const userSelections = new Map<string, string>();

	votingResults.forEach((users, vote) => {
		users.forEach((user) => {
			userSelections.set(user,vote);
		})
	});

	return userSelections;
}