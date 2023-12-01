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

// Tier List Types
// eslint-disable-next-line no-shadow
export enum Tier {
  S = '👑',
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  F = 'F',
  Skull = '\uD83D\uDC80',
}

export type SubmitterStats = {
  submitter: string;
  totalSubmissions: number;
  averageSubmissionScore: string;
  totalScore: number;
}