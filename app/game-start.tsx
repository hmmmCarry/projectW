import WordleBoard from "@/components/WordleBoard";
import { getSocket } from "@/lib/socket";
import { normalizeGuessPatterns } from "@/utils/normalizeGuess";
import { useLocalSearchParams, router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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

type GuessRow = {
  letters: string;
  states?: GuessPattern[];
};

export default function GameStart() {
  const socket = useMemo(() => getSocket(), []);
  const { roomId: roomParam } = useLocalSearchParams<Params>();
  const roomId = typeof roomParam === "string" ? roomParam : "";

  const [room, setRoom] = useState<RoomState | null>(null);
  const [socketId, setSocketId] = useState<string | null>(socket.id ?? null);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    const onConnect = () => setSocketId(socket.id ?? null);
    const onRoom = (state: RoomState) => setRoom(state);

    socket.on("connect", onConnect);
    socket.on("roomState", onRoom);

    return () => {
      socket.off("connect", onConnect);
      socket.off("roomState", onRoom);
    };
  }, [socket]);

  const allPlayers = useMemo(() => Object.values(room?.players ?? {}), [room?.players]);
  const viewerList = useMemo(() => allPlayers.filter((p) => p.id !== room?.hostId), [allPlayers, room?.hostId]);

  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef<FlatList<Player>>(null);

  const handlePressPill = (index: number) => {
    setActiveIndex(index);
    pagerRef.current?.scrollToIndex({ index, animated: true });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index?: number }> }) => {
    if (viewableItems?.length > 0) {
      const next = viewableItems[0].index ?? 0;
      if (typeof next === "number") setActiveIndex(next);
    }
  }).current;

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 60 });

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
  }, [isHost, room?.battle?.started, me?.name, roomId, socketId]);

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

  const renderBoard = ({ item }: { item: Player }) => (
    <View style={{ width: "100%", paddingHorizontal: 16 }}>
      <View style={{ alignItems: "center", marginTop: 10, marginBottom: 6 }}>
        <Text className="text-sm text-neutral-600">{item.name || "Player"}</Text>
      </View>
      <View style={{ height: 460, justifyContent: "center", alignItems: "center" }}>
        <WordleBoard
          guesses={buildBoard(item)}
          gap={6}
          revealRowIndex={item.guesses ? item.guesses.length - 1 : null}
        />
      </View>
    </View>
  );

  const headerMessage = useMemo(() => {
    if (!room) return "Connecting to room...";
    if (!room.battle?.hasSecret) return "Set a word and start when ready.";
    if (!room.battle?.started) return "Waiting to start the round.";
    return "Viewing players' boards";
  }, [room]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
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

        <FlatList
          ref={pagerRef}
          data={viewerList}
          keyExtractor={(player) => player.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={renderBoard}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewConfigRef.current}
          decelerationRate="fast"
          snapToAlignment="start"
        />
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
