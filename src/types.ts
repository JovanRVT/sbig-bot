import {
  ChatInputCommandInteraction,
  Client,
  ContextMenuCommandBuilder,
  Message,
  MessageContextMenuCommandInteraction,
  MessageReaction,
  SlashCommandBuilder,
  User,
} from 'discord.js';

/* --------------------
 * Feature handlers
 */

export type OnStartupHandler = (client: Client) => Promise<void>;

export type OnMessageHandler = (
  client: Client,
  message: Message
) => Promise<void>;

export type OnReactionHandler = (
  client: Client,
  reaction: MessageReaction,
  user: User
) => Promise<void>;

/* -------------------------------------------------- */

export type FeatureFile = {
  onStartup?: OnStartupHandler;
  onMessage?: OnMessageHandler;
  onReactionAdd?: OnReactionHandler;
  onReactionRemove?: OnReactionHandler;
};

export type SlashCommand = {
  data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  execute: (interaction: ChatInputCommandInteraction) => void | Promise<void>;
};

export type SlashCommandFile = {
  command: SlashCommand;
};

export type ContextMenuCommand = {
  data: ContextMenuCommandBuilder;
  execute: (
    interaction: MessageContextMenuCommandInteraction
  ) => void | Promise<void>;
};

export type ContextMenuCommandFile = {
  command: ContextMenuCommand;
};

export type MovieData = {
  sbigRank: string;
  sbigNotes: string;
  sbigWatchedDate: string;
  sbigSubmitter: string;
  sbigVoteResults: string,
  title: string;
  plot: string;
  image: string;
  imdbRating: number;
  genre: string;
  release: string;
  runtime: string;
  rating: string;
  year: number;
  otherRatings: {Source: string, Value: string}[];
  director: string;
  actors: string;
  writers: string;
  boxOffice: string;
  imdbId: string;
}