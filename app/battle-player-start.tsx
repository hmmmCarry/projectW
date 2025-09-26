import GameKeyboard from "@/components/Keyboard";
import WordleBoard from "@/components/WordleBoard";
import { getSocket } from "@/lib/socket";
import { normalizeGuessPatterns, normalizeGuessStates } from "@/utils/normalizeGuess";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BattleProgressStrip from "./battle-opponent-strip";

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;
const KEYBOARD_HEIGHT = 260;

type GuessPattern = "correct" | "present" | "absent" | "tbd" | "empty";
type PlayerGuess = { guess: string; pattern?: GuessPattern[] };

type BattlePlayer = {
  id: string;
  name?: string;
  guesses?: PlayerGuess[];
  done?: boolean;
  wins?: number;
  streak?: number;
  disconnected?: boolean;
};

type BattleRoomState = {
  id: string;
  mode: "duel" | "battle";
  hostId?: string;
  players: Record<string, BattlePlayer>;
  started?: boolean; // duel-level flag, ignore in battle
  winner?: string | "draw" | null; // duel winner, ignore in battle
  battle: {
    started: boolean;
    winner: string | null;
    hasSecret: boolean;
    secret: null;
    lastRevealedWord: string | null;
  };
};

type GuessAck = { ok?: boolean; error?: string; pattern?: GuessPattern[] };

type Params = { roomId?: string; name?: string };

export default function BattlePlayerGameStart() {
  const router = useRouter();
  const socket = useMemo(() => getSocket(), []);
  const { roomId: roomParam, name: nameParam } = useLocalSearchParams<Params>();
  const roomId = typeof roomParam === "string" ? roomParam : "";
  const playerName = typeof nameParam === "string" ? decodeURIComponent(nameParam) : "Player";

  const [room, setRoom] = useState<BattleRoomState | null>(null);
  const [socketId, setSocketId] = useState<string | null>(socket.id ?? null);
  const [guess, setGuess] = useState("");
  const [guessError, setGuessError] = useState<string | null>(null);
  const [guessLoading, setGuessLoading] = useState(false);

  const boardShake = useRef(new Animated.Value(0)).current;
  const shakeTranslate = boardShake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] });
  const [boardAreaSize, setBoardAreaSize] = useState({ width: 0, height: 0 });
  const handleBoardLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;
    setBoardAreaSize({ width, height });
  }, []);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
    
    const handleConnect = () => {
      console.log("Socket connected, ID:", socket.id);
      setSocketId(socket.id ?? null);
    };
    
    const handleRoomState = (state: BattleRoomState) => {
      console.log("Room state received:", state);
      setRoom(state);
    };
    
    socket.on("connect", handleConnect);
    socket.on("roomState", handleRoomState);
    
    return () => {
      socket.off("connect", handleConnect);
      socket.off("roomState", handleRoomState);
    };
  }, [socket]);

  // Join room when we have both roomId and socketId
  useEffect(() => {
    if (roomId && socketId && socket.connected) {
      console.log("Attempting to join room:", { roomId, socketId, playerName });
      
      // Check if we're already in the room
      if (room?.players?.[socketId]) {
        console.log("Already in room, staying on current screen");
        return;
      }
      
      socket.emit("joinRoom", { name: playerName, roomId }, (res?: { ok?: boolean; error?: string }) => {
        console.log("Join room response:", res);
        if (res?.ok) {
          console.log("Successfully joined room, navigating to waiting screen");
          router.push(`/battle-waiting?roomId=${roomId}`);
        } else {
          console.error("Failed to join room:", res?.error);
          alert(res?.error || "Failed to join room");
        }
      });
    }
  }, [roomId, socketId, playerName, room?.players, socket, router]);

  const players = useMemo(() => Object.values(room?.players ?? {}), [room?.players]);
  const me = socketId ? room?.players?.[socketId] : undefined;

  const canGuess = !!room?.battle?.started && !!me && !me.done && socketId !== room?.hostId;
  const myBoard = useMemo(() => buildBoard(me, guess), [me, guess]);

  const stageMessage = deriveStageMessage({ room, players, me, socketId });

  const triggerBoardShake = () => {
    boardShake.setValue(0);
    Animated.sequence([
      Animated.timing(boardShake, { toValue: 1, duration: 45, useNativeDriver: true }),
      Animated.timing(boardShake, { toValue: -1, duration: 45, useNativeDriver: true }),
      Animated.timing(boardShake, { toValue: 1, duration: 45, useNativeDriver: true }),
      Animated.timing(boardShake, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  };

  const handleGuessSubmit = () => {
    if (!roomId || !canGuess || guessLoading) return;
    if (guess.length !== WORD_LENGTH) {
      setGuessError("Type a 5-letter guess.");
      return;
    }
    setGuessLoading(true);
    socket.emit(
      "makeGuess",
      { roomId, guess },
      (res?: GuessAck) => {
        setGuessLoading(false);
        if (res?.ok) {
          setGuess("");
          setGuessError(null);
        } else {
          setGuessError(res?.error || "Guess was rejected.");
          triggerBoardShake();
        }
      },
    );
  };

  const handleKeyPress = (key: string) => {
    if (key === "ENTER") {
      handleGuessSubmit();
      return;
    }
    if (key === "BACKSPACE") {
      setGuess((prev) => prev.slice(0, -1));
      setGuessError(null);
      return;
    }
    if (!/^[A-Z]$/.test(key)) return;
    if (canGuess && guess.length < WORD_LENGTH) {
      setGuess((prev) => (prev + key).slice(0, WORD_LENGTH));
      setGuessError(null);
    }
  };

  const enterStatus: "default" | "ready" | "disabled" = canGuess
    ? (guess.length === WORD_LENGTH ? "ready" : "default")
    : "disabled";

  // Build opponent strip data, excluding self
  const stripPlayers = useMemo(() => {
    return players
      .filter((p) => p.id !== socketId)
      .map((p) => ({
        id: p.id,
        name: p.name || "—",
        avatarEmoji: undefined,
        wins: p.wins ?? 0,
        streak: p.streak ?? 0,
        guesses: p.guesses?.length ?? 0,
        online: !p.disconnected,
      }));
  }, [players, socketId]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 px-4 pt-2 pb-1">
        <BattleProgressStrip players={stripPlayers} style={{ marginTop: 6 }} />

        <View className="w-full items-center mt-3">
          <Text className="text-xs text-neutral-500">{stageMessage}</Text>
        </View>

        <View style={{ flex: 1, marginTop: 8 }} onLayout={handleBoardLayout}>
          <Animated.View
            style={{ flex: 1, transform: [{ translateX: shakeTranslate }] }}
          >
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 12 }}>
              <WordleBoard
                guesses={myBoard}
                maxWidth={boardAreaSize.width || undefined}
                maxHeight={boardAreaSize.height || undefined}
                gap={6}
                revealRowIndex={me?.guesses ? me.guesses.length - 1 : null}
              />
            </View>
          </Animated.View>
        </View>
        </View>

      <View style={{ height: KEYBOARD_HEIGHT, justifyContent: "flex-end" }}>
        <GameKeyboard
          onKeyPress={handleKeyPress}
          enterStatus={enterStatus}
          disabled={!canGuess || guessLoading}
          letterStates={deriveKeyboardStates(me)}
        />
      </View>
    </SafeAreaView>
  );
}

function buildBoard(player?: BattlePlayer, pendingGuess = "") {
  const guesses = player?.guesses ?? [];
  const rows = guesses.map((g) => ({
    letters: g.guess || "",
    states: g.pattern ? normalizeGuessPatterns(g.pattern) : undefined,
  }));
  if (pendingGuess && guesses.length < MAX_GUESSES) {
    rows.push({
      letters: pendingGuess.padEnd(WORD_LENGTH, " "),
      states: Array.from({ length: WORD_LENGTH }, (_, i) => (i < pendingGuess.length ? ("tbd" as GuessPattern) : ("empty" as GuessPattern))),
    });
  }
  return rows;
}

function deriveKeyboardStates(me?: BattlePlayer) {
  const map: Record<string, "correct" | "present" | "absent"> = {};
  if (!me?.guesses?.length) return map;
  for (const g of me.guesses) {
    const letters = (g.guess || "").toUpperCase().split("");
    const states = g.pattern ? normalizeGuessStates(g.pattern as unknown as string[]) : [];
    letters.forEach((ch, i) => {
      const s = states[i];
      if (!/[A-Z]/.test(ch)) return;
      if (!s) return;
      const prev = map[ch];
      if (s === "correct") map[ch] = "correct";
      else if (s === "present") {
        if (prev !== "correct") map[ch] = "present";
      } else if (s === "absent") {
        if (!prev) map[ch] = "absent";
      }
    });
  }
  return map;
}

function deriveStageMessage({ room, players, me, socketId }: { room: BattleRoomState | null; players: BattlePlayer[]; me?: BattlePlayer; socketId: string | null; }) {
  if (!room) return "Connecting to room...";
  if (!socketId) return "Connecting to server...";
  const nonHostPlayers = players.filter((p) => p.id !== room.hostId);
  if (nonHostPlayers.length < 1) return "Waiting for players to join.";
  if (!room.battle.started) return room.battle.hasSecret ? "Waiting for host to start..." : "Waiting for host to set a word...";
  if (socketId === room.hostId) return "Host is spectating this round.";
  if (me?.done) return "No guesses left.";
  return "Guess the host's word!";
}
