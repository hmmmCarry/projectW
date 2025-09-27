import React from "react";
import PlayerPill, { PlayerPillGuessStateInput } from "./player-pill";

export type BattleChipPlayer = {
  id: string;
  name: string;
  avatarEmoji?: string;
  avatarUri?: string;
  wins?: number;
  streak?: number;
  guesses?: number;
  guessPatterns?: PlayerPillGuessStateInput[][];
  online?: boolean;
};

type Props = {
  player: BattleChipPlayer;
  tone?: "light" | "dark";
  active?: boolean;
  onPress?: () => void;
};

export default function BattleOpponentChip({ player, tone = "light", active = false, onPress }: Props) {
  return (
    <PlayerPill
      name={player.name}
      avatar={player.avatarEmoji}
      avatarUri={player.avatarUri}
      wins={player.wins ?? 0}
      streak={player.streak ?? 0}
      online={player.online ?? true}
      guessesCount={player.guesses ?? player.guessPatterns?.length ?? 0}
      maxGuesses={6}
      gridRows={3}
      gridCols={5}
      showProgressGrid
      guessPatterns={player.guessPatterns}
      tone={tone}
      active={active}
      onPress={onPress}
    />
  );
}
