import WordleBoard from "@/components/WordleBoard";
import { getSocket } from "@/lib/socket";
import { useTheme } from "@/providers/ThemeProvider";
import { normalizeGuessPatterns } from "@/utils/normalizeGuess";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PlayerPill from "./player-pill";

type GuessPattern = "correct" | "present" | "absent" | "tbd" | "empty";
type PlayerGuess = { guess: string; pattern?: GuessPattern[] };

type Player = {
  id: string;
  name?: string;
  guesses?: PlayerGuess[];
  wins?: number;
  streak?: number;
  disconnected?: boolean;
};

type BattleState = {
  started: boolean;
  winner: string | null;
  hasSecret: boolean;
  secret: null;
  lastRevealedWord: string | null;
};

type RoomState = {
  id: string;
  mode: "duel" | "battle";
  hostId?: string;
  players: Record<string, Player>;
  battle: BattleState;
};

type Params = { roomId?: string };
type GuessRow = { letters: string; states?: GuessPattern[] };
type SyncResponse = { ok?: boolean; error?: string; state?: RoomState };

export default function GameStart() {
  const socket = useMemo(() => getSocket(), []);
  const theme = useTheme();
  const { colors } = theme;
  const { roomId: roomParam } = useLocalSearchParams<Params>();
  const roomId = typeof roomParam === "string" ? roomParam : "";

  const [room, setRoom] = useState<RoomState | null>(null);
  const [socketId, setSocketId] = useState<string | null>(socket.id ?? null);

  useEffect(() => {
    const hydrate = () => {
      if (!roomId) return;
      socket.emit("syncRoom", { roomId }, (res?: SyncResponse) => {
        if (res?.ok && res.state) {
          setRoom(res.state);
        } else if (res?.error) {
          console.warn("[game-start] syncRoom failed", res.error);
        }
      });
    };

    if (!socket.connected) socket.connect();

    const handleConnect = () => {
      setSocketId(socket.id ?? null);
      hydrate();
    };

    const handleDisconnect = () => setSocketId(null);
    const handleRoomState = (state: RoomState) => setRoom(state);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("roomState", handleRoomState);

    if (socket.connected) {
      setSocketId(socket.id ?? null);
      hydrate();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("roomState", handleRoomState);
    };
  }, [socket, roomId]);

  const allPlayers = useMemo(() => Object.values(room?.players ?? {}), [room?.players]);
  const viewerList = useMemo(
    () => allPlayers.filter((player) => player.id !== room?.hostId),
    [allPlayers, room?.hostId],
  );

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((prev) => {
      if (viewerList.length === 0) return 0;
      return Math.min(prev, viewerList.length - 1);
    });
  }, [viewerList.length]);

  const handlePressPill = (index: number) => {
    setActiveIndex(index);
  };

  const selectedPlayer = viewerList[activeIndex] ?? viewerList[0] ?? null;

  const me = socketId ? room?.players?.[socketId] : undefined;
  const isHost = socketId != null && room?.hostId === socketId;
  const hasNavigatedRef = useRef(false);
  const wasRoundActiveRef = useRef(false);

  useEffect(() => {
    if (room?.battle?.started) {
      wasRoundActiveRef.current = true;
    }
  }, [room?.battle?.started]);

  useEffect(() => {
    if (!isHost) return;
    if (!room?.battle) return;
    if (room.battle.started) return;
    if (!wasRoundActiveRef.current) return;
    if (hasNavigatedRef.current) return;

    hasNavigatedRef.current = true;
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (me?.name) params.set("name", me.name);
      if (roomId) params.set("roomId", roomId);
      if (socketId) params.set("hostId", socketId);
      router.replace(params.toString() ? `/create?${params.toString()}` : "/create");
    }, 400);

    return () => clearTimeout(timeout);
  }, [isHost, room?.battle?.started, roomId, socketId, me?.name]);

  const renderPill = (player: Player, index: number) => (
    <PlayerPill
      key={player.id}
      name={player.name || "Player"}
      avatar={(player.name || "?").charAt(0).toUpperCase()}
      wins={player.wins ?? 0}
      streak={player.streak ?? 0}
      online={!player.disconnected}
      guessesCount={player.guesses?.length ?? 0}
      maxGuesses={6}
      gridRows={3}
      gridCols={5}
      onPress={() => handlePressPill(index)}
      active={index === activeIndex}
      showProgressGrid
      guessPatterns={player.guesses?.map((g) => g.pattern || [])}
    />
  );

  const headerMessage = useMemo(() => {
    if (!room) return "Connecting to room...";
    if (!room.battle?.hasSecret) return "Set a word and start when ready.";
    if (!room.battle?.started) return "Waiting to start the round.";
    return "Viewing players' boards";
  }, [room]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="w-full px-4 pt-2">
        <View className="items-center mb-2">
          <Text className="text-xs text-neutral-500">{headerMessage}</Text>
        </View>

        <FlatList
          data={viewerList}
          keyExtractor={(player) => player.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 2, paddingVertical: 6 }}
          renderItem={({ item, index }) => renderPill(item, index)}
        />

        <View style={{ width: "100%", paddingHorizontal: 16, marginTop: 16 }}>
          {selectedPlayer ? (
            <>
              <View style={{ alignItems: "center", marginBottom: 10 }}>
                <Text className="text-sm text-neutral-600">{selectedPlayer.name || "Player"}</Text>
              </View>
              <View style={{ height: 460, justifyContent: "center", alignItems: "center" }}>
                <WordleBoard
                  guesses={buildBoard(selectedPlayer)}
                  gap={5}
                  revealRowIndex={selectedPlayer.guesses ? selectedPlayer.guesses.length - 1 : null}
                />
              </View>
            </>
          ) : (
            <View style={{ height: 200, alignItems: "center", justifyContent: "center" }}>
              <Text className="text-sm text-neutral-500">No players to display yet.</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function buildBoard(player?: Player): GuessRow[] {
  const guesses = player?.guesses ?? [];
  return guesses.map((guess) => ({
    letters: guess.guess || "",
    states: guess.pattern ? normalizeGuessPatterns(guess.pattern) : undefined,
  }));
}
