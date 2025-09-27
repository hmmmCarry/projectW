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
  const [spectateTargetId, setSpectateTargetId] = useState<string | null>(null);


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
          console.log("Successfully joined room, staying on game screen");
          // Stay on this screen like duel does
        } else {
          console.error("Failed to join room:", res?.error);
          alert(res?.error || "Failed to join room");
        }
      });
    }
  }, [roomId, socketId, playerName, room?.players, socket]);

  const players = useMemo(() => Object.values(room?.players ?? {}), [room?.players]);
  const me = socketId ? room?.players?.[socketId] : undefined;

  const isHost = socketId != null && room?.hostId === socketId;

  const canGuess = !!room?.battle?.started && !!me && !me.done && !isHost;

  const viewingPlayer = useMemo(() => {
    if (isHost) {
      const pool = players.filter((p) => p.id !== room?.hostId && p.id !== socketId);
      if (spectateTargetId) {
        const selected = pool.find((p) => p.id === spectateTargetId);
        if (selected) {
          return selected;
        }
      }
      return pool.length > 0 ? pool[0] : undefined;
    }
    return me;
  }, [isHost, me, players, room?.hostId, socketId, spectateTargetId]);

  const pendingGuessForBoard = !isHost && viewingPlayer?.id === me?.id ? guess : "";
  const activeBoard = useMemo(() => buildBoard(viewingPlayer, pendingGuessForBoard), [viewingPlayer, pendingGuessForBoard]);

  const stageMessage = deriveStageMessage({ room, players, me, socketId });

  const handleSpectateSelect = useCallback((playerId: string) => {
    if (!isHost) return;
    setSpectateTargetId((current) => (current === playerId ? current : playerId));
  }, [isHost]);

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

  // Build progress strip data, excluding self
  const stripPlayers = useMemo(() => {
    return players
      .filter((p) => p.id !== socketId)
      .map((p) => ({
        id: p.id,
        name: p.name || "—",
        avatarEmoji: (((p.name || "?").trim().charAt(0) || "?")).toUpperCase(),
        wins: p.wins ?? 0,
        streak: p.streak ?? 0,
        guesses: p.guesses?.length ?? 0,
        online: !p.disconnected,
      }));
  }, [players, socketId]);

  useEffect(() => {
    if (!isHost) {
      if (spectateTargetId !== null) {
        setSpectateTargetId(null);
      }
      return;
    }

    const nonHostPlayers = players.filter((p) => p.id !== room?.hostId && p.id !== socketId);
    const currentValid = spectateTargetId && nonHostPlayers.some((p) => p.id === spectateTargetId);
    if (!currentValid) {
      const nextId = nonHostPlayers.length > 0 ? nonHostPlayers[0].id : null;
      if (nextId !== spectateTargetId) {
        setSpectateTargetId(nextId);
      }
    }
  }, [isHost, players, room?.hostId, socketId, spectateTargetId]);

  // Show waiting screen if game hasn't started
  if (room && !room.battle.started) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="flex-1 px-4 pt-2">
          <View className="items-center mb-6">
            <Text className="text-lg font-semibold text-gray-700 mt-2">Waiting Room</Text>
            <Text className="text-sm text-gray-500 mt-1">{stageMessage}</Text>
          </View>

          <View className="bg-white rounded-xl p-4 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-semibold">Players ({players.filter(p => p.id !== room.hostId).length}/6)</Text>
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 bg-green-400 rounded-full" />
                <Text className="text-sm text-gray-600">Online</Text>
              </View>
            </View>

            {players.filter(p => p.id !== room.hostId).length === 0 ? (
              <View className="py-8">
                <Text className="text-gray-500 text-center">No players joined yet</Text>
              </View>
            ) : (
              <View>
                {players.filter(p => p.id !== room.hostId).map((player) => (
                  <View key={player.id} className="flex-row items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <View className="flex-row items-center gap-3">
                      <View className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center">
                        <Text className="text-sm font-semibold text-gray-700">
                          {(player.name || "?").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text className="text-gray-800 font-medium">{player.name || "Unknown"}</Text>
                    </View>
                    <View className="flex-row items-center gap-4">
                      <Text className="text-sm text-gray-500">W:{player.wins || 0}</Text>
                      <Text className="text-sm text-gray-500">S:{player.streak || 0}</Text>
                      <View
                        className={`w-2 h-2 rounded-full ${
                          player.disconnected ? "bg-red-400" : "bg-green-400"
                        }`}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {me && (
            <View className="bg-blue-50 rounded-xl p-4">
              <Text className="text-blue-800 font-medium text-center">
                You're ready to play! Waiting for the game to start...
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Show game results screen if game has ended
  if (room && room.battle.started && room.battle.winner) {
    const winner = players.find(p => p.id === room.battle.winner);
    const revealedWord = room.battle.lastRevealedWord;
    
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="flex-1 px-4 pt-2">
          {/* Header */}
          <View className="items-center mb-6">
            <Text className="text-2xl font-bold text-gray-800">Battle Royale</Text>
            {winner && (
              <Text className="text-lg text-blue-600 font-semibold mt-1">
                Winner: {winner.name}
              </Text>
            )}
          </View>

          {/* Round Results */}
          <View className="items-center mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Text className="text-lg">🏆</Text>
              <Text className="text-lg font-semibold text-gray-700">Round Results</Text>
            </View>
            
            {/* Revealed Word */}
            {revealedWord && (
              <View className="flex-row gap-2 mb-4">
                {revealedWord.toUpperCase().split('').map((letter, i) => (
                  <View
                    key={i}
                    className="w-12 h-12 rounded border items-center justify-center"
                    style={{
                      backgroundColor: "#6AAA64",
                      borderColor: "#6AAA64",
                    }}
                  >
                    <Text className="text-white font-extrabold text-lg">
                      {letter}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Podium */}
            {winner && (
              <View className="bg-white rounded-xl p-6 items-center shadow-sm">
                <Text className="text-2xl mb-2">👑</Text>
                <Text className="text-xl mb-1">🥇</Text>
                <Text className="text-xl font-bold text-gray-800 mb-1">
                  {winner.name}
                </Text>
                <Text className="text-sm text-gray-500">1</Text>
              </View>
            )}
          </View>

          {/* Player Stats Table */}
          <View className="bg-white rounded-xl p-4">
            <View className="flex-row bg-gray-100 rounded-lg px-3 py-2 mb-3">
              <Text className="flex-1 text-sm font-semibold text-gray-600">Player</Text>
              <Text className="w-16 text-sm font-semibold text-gray-600">Round</Text>
              <Text className="w-12 text-sm font-semibold text-gray-600">Wins</Text>
              <Text className="w-12 text-sm font-semibold text-gray-600">Streak</Text>
            </View>
            
            {players.filter(p => p.id !== room.hostId).map((player) => (
              <View
                key={player.id}
                className={`flex-row items-center py-2 px-3 rounded-lg mb-1 ${
                  player.id === room.battle.winner ? "bg-yellow-50" : ""
                }`}
              >
                <View className="flex-1 flex-row items-center gap-2">
                  <View
                    className={`w-2 h-2 rounded-full ${
                      player.id === room.battle.winner
                        ? "bg-yellow-500"
                        : "bg-gray-300"
                    }`}
                  />
                  <Text className="text-sm text-gray-800 font-medium">
                    {player.name || "Unknown"}
                  </Text>
                </View>
                <Text className="w-16 text-sm text-gray-600">
                  {player.guesses?.length || 0}
                </Text>
                <Text className="w-12 text-sm text-gray-600">
                  {player.wins || 0}
                </Text>
                <Text className="w-12 text-sm text-gray-600">
                  {player.streak || 0}
                </Text>
              </View>
            ))}
          </View>

          {/* Waiting for next game */}
          <View className="bg-blue-50 rounded-xl p-4 mt-4">
            <Text className="text-blue-800 font-medium text-center">
              Waiting for host to start the next game...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 px-4 pt-2 pb-1">
        <BattleProgressStrip
          players={stripPlayers}
          style={{ marginTop: 6 }}
          selectedId={isHost ? spectateTargetId : undefined}
          onSelect={isHost ? handleSpectateSelect : undefined}
        />

        <View className="w-full items-center mt-3">
          <Text className="text-xs text-neutral-500">{stageMessage}</Text>
          {isHost ? (
            <Text className="text-xs text-neutral-600 mt-1">
              {viewingPlayer ? `Viewing ${viewingPlayer.name || "player"}'s board` : "No players to spectate yet"}
            </Text>
          ) : null}
        </View>

        <View style={{ flex: 1, marginTop: 8 }} onLayout={handleBoardLayout}>
          <Animated.View
            style={{ flex: 1, transform: [{ translateX: shakeTranslate }] }}
          >
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 12 }}>
              <WordleBoard
                guesses={activeBoard}
                maxWidth={boardAreaSize.width || undefined}
                maxHeight={boardAreaSize.height || undefined}
                gap={6}
                revealRowIndex={viewingPlayer?.guesses ? viewingPlayer.guesses.length - 1 : null}
              />
            </View>
          </Animated.View>
        </View>
        </View>

      {!isHost ? (
        <View style={{ height: KEYBOARD_HEIGHT, justifyContent: "flex-end" }}>
          <GameKeyboard
            onKeyPress={handleKeyPress}
            enterStatus={enterStatus}
            disabled={!canGuess || guessLoading}
            letterStates={deriveKeyboardStates(me)}
          />
        </View>
      ) : (
        <View style={{ height: KEYBOARD_HEIGHT, alignItems: "center", justifyContent: "center" }}>
          <Text className="text-xs text-neutral-500">
            {viewingPlayer ? `Spectating ${viewingPlayer.name || "player"}` : "Waiting for players"}
          </Text>
        </View>
      )}
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
      states: Array.from({ length: WORD_LENGTH }, (_, i) =>
        i < pendingGuess.length ? ("tbd" as GuessPattern) : ("empty" as GuessPattern)
      ),
    });
  }
  while (rows.length < MAX_GUESSES) {
    rows.push({
      letters: "".padEnd(WORD_LENGTH, " "),
      states: Array.from({ length: WORD_LENGTH }, () => "empty" as GuessPattern),
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
