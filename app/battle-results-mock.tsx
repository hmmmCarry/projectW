// app/battle/results.tsx (example)
import { SafeAreaView } from "react-native-safe-area-context";
import GameResults from "./battle-game-results";

export default function BattleResultsMock() {
  const room = { hostId: "HOST123", battle: { winner: "P2" } };
  const players = [
    { id: "HOST123", name: "Host", wins: 0, streak: 0, guesses: [] },
    { id: "P1", name: "player1", wins: 1, streak: 1, guesses: [{ guess: "HOUSE" }] },
    { id: "P2", name: "player2", wins: 2, streak: 2, guesses: [{ guess: "HOUND" }, { guess: "HOUSE" }] },
    { id: "P3", name: "player3", wins: 2, streak: 2, guesses: [{ guess: "HOUND" }, { guess: "HOUSE" }] },
    { id: "P4", name: "player4", wins: 2, streak: 2, guesses: [{ guess: "HOUND" }, { guess: "HOUSE" }] },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F6F6FE] dark:bg-neutral-950">
      <GameResults room={room} players={players} correctWord="HOUSE" />
    </SafeAreaView>
  );
}
