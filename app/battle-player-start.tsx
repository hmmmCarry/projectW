import GameKeyboard from "@/components/Keyboard";
import WordleBoard from "@/components/WordleBoard";
import { getSocket } from "@/lib/socket";
import { useTheme } from "@/providers/ThemeProvider";
import { normalizeGuessPatterns, normalizeGuessStates } from "@/utils/normalizeGuess";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GameResults from "./battle-game-results";
import BattleProgressStrip from "./battle-opponent-strip";

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;
const KEYBOARD_HEIGHT = 260;

type GuessPattern = "correct" | "present" | "absent" | "tbd" | "empty";
type PlayerGuess = {
  guess: string;
  pattern?: GuessPattern[];
};

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
  started?: boolean;
  winner?: string | "draw" | null;
  battle: {
    started: boolean;
    winner: string | null;
    hasSecret: boolean;
    secret: string | null;
    lastRevealedWord: string | null;
  };
};

type GuessAck = { ok?: boolean; error?: string; pattern?: GuessPattern[] };
type SetWordAck = { ok?: boolean; error?: string };
type StartBattleAck = { ok?: boolean; error?: string };
type ResetAck = { ok?: boolean; error?: string };
type SyncResponse = { ok?: boolean; error?: string; state?: BattleRoomState };
type Params = { roomId?: string; name?: string };

export default function BattlePlayerGameStart() {
  const socket = useMemo(() => getSocket(), []);
  const theme = useTheme();
  const { colors } = theme;
  const { roomId: roomParam, name: nameParam } = useLocalSearchParams<Params>();
  const roomId = typeof roomParam === "string" ? roomParam : "";
  const playerName = typeof nameParam === "string" ? decodeURIComponent(nameParam) : "Player";

  const [room, setRoom] = useState<BattleRoomState | null>(null);
  const [socketId, setSocketId] = useState<string | null>(socket.id ?? null);
  const [guess, setGuess] = useState("");
  const [guessError, setGuessError] = useState<string | null>(null);
  const [guessLoading, setGuessLoading] = useState(false);
  const [spectateTargetId, setSpectateTargetId] = useState<string | null>(null);

  const [secretInput, setSecretInput] = useState("");
  const [secretError, setSecretError] = useState<string | null>(null);
  const [secretLoading, setSecretLoading] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const boardShake = useRef(new Animated.Value(0)).current;
  const shakeTranslate = boardShake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] });

  useEffect(() => {
    const hydrate = () => {
      if (!roomId) return;
      socket.emit("syncRoom", { roomId }, (res?: SyncResponse) => {
        if (res?.ok && res.state) {
          setRoom(res.state);
        } else if (res?.error) {
          console.warn("[battle-start] syncRoom failed", res.error);
        }
      });
    };

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      setSocketId(socket.id ?? null);
      hydrate();
    };

    const handleDisconnect = () => setSocketId(null);
    const handleRoomState = (state: BattleRoomState) => setRoom(state);

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

  useEffect(() => {
    if (!roomId || !socketId || !socket.connected) return;
    if (room?.players?.[socketId]) return;

    socket.emit(
      "joinRoom",
      { name: playerName, roomId },
      (res?: { ok?: boolean; error?: string }) => {
        if (!res?.ok) {
          console.error("Failed to join room:", res?.error);
          alert(res?.error || "Failed to join room");
        }
      },
    );
  }, [roomId, socketId, socket, playerName, room?.players]);

  const players = useMemo(() => Object.values(room?.players ?? {}), [room?.players]);
  const me = socketId ? room?.players?.[socketId] : undefined;
  const isHost = socketId != null && room?.hostId === socketId;

  const spectateTargets = useMemo(
    () => players.filter((p) => p.id !== room?.hostId),
    [players, room?.hostId],
  );

  const resolvedSpectateTargetId = useMemo(() => {
    if (!isHost) return me?.id ?? null;
    if (!spectateTargets.length) return null;
    if (spectateTargetId && spectateTargets.some((p) => p.id === spectateTargetId)) {
      return spectateTargetId;
    }
    return spectateTargets[0].id;
  }, [isHost, spectateTargets, spectateTargetId, me?.id]);

  useEffect(() => {
    if (!isHost && spectateTargetId) {
      setSpectateTargetId(null);
    }
  }, [isHost, spectateTargetId]);

  const viewingPlayer = useMemo(() => {
    if (isHost) {
      if (!spectateTargets.length) return undefined;
      return spectateTargets.find((p) => p.id === resolvedSpectateTargetId) ?? spectateTargets[0];
    }
    return me;
  }, [isHost, spectateTargets, resolvedSpectateTargetId, me]);

  const pendingGuessForBoard =
    !isHost && viewingPlayer && viewingPlayer.id === me?.id ? guess : "";

  const activeBoard = useMemo(
    () => buildBoard(viewingPlayer, pendingGuessForBoard),
    [viewingPlayer, pendingGuessForBoard],
  );

  const hostBoardEntries = useMemo(
    () => spectateTargets.map((player) => ({ player, board: buildBoard(player) })),
    [spectateTargets],
  );

  const canGuess = !!room?.battle?.started && !!me && !me.done && !isHost;
  const enterStatus: "default" | "ready" | "disabled" = canGuess
    ? guess.length === WORD_LENGTH
      ? "ready"
      : "default"
    : "disabled";

  const stripPlayers = useMemo(
    () =>
      spectateTargets.map((p) => ({
        id: p.id,
        name: p.name || "Player",
        avatarEmoji: getAvatarToken(p.name),
        wins: p.wins ?? 0,
        streak: p.streak ?? 0,
        guesses: p.guesses?.length ?? 0,
        guessPatterns: p.guesses?.map((g) =>
          Array.from({ length: WORD_LENGTH }, (_, idx) => g.pattern?.[idx] ?? "idle")
        ),
        online: !p.disconnected,
      })),
    [spectateTargets],
  );
  const playerCount = spectateTargets.length;
  const stageMessage = deriveStageMessage({
    room,
    players: spectateTargets,
    me,
    socketId,
    isHost,
  });

  const secretReady = /^[A-Z]{5}$/.test(secretInput);
  const guessesUsed = me?.guesses?.length ?? 0;
  const guessesLeft = Math.max(0, MAX_GUESSES - guessesUsed);

  const triggerBoardShake = useCallback(() => {
    boardShake.setValue(0);
    Animated.sequence([
      Animated.timing(boardShake, { toValue: 1, duration: 45, useNativeDriver: true }),
      Animated.timing(boardShake, { toValue: -1, duration: 45, useNativeDriver: true }),
      Animated.timing(boardShake, { toValue: 1, duration: 45, useNativeDriver: true }),
      Animated.timing(boardShake, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  }, [boardShake]);

  const handleGuessSubmit = useCallback(() => {
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
  }, [roomId, canGuess, guess, guessLoading, socket, triggerBoardShake]);

  const handleKeyPress = useCallback(
    (key: string) => {
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
    },
    [canGuess, guess.length, handleGuessSubmit],
  );

  const handleSpectateSelect = useCallback(
    (playerId: string) => {
      if (!isHost) return;
      setSpectateTargetId(playerId);
    },
    [isHost],
  );

  const handleSecretChange = useCallback((value: string) => {
    const cleaned = value.replace(/[^A-Za-z]/g, "").toUpperCase();
    setSecretInput(cleaned.slice(0, WORD_LENGTH));
    setSecretError(null);
  }, []);

  const handleSecretSubmit = useCallback(() => {
    if (!isHost || !roomId) return;
    if (!/^[A-Z]{5}$/.test(secretInput)) {
      setSecretError("Enter a 5-letter word.");
      return;
    }
    setSecretLoading(true);
    socket.emit(
      "setHostWord",
      { roomId, secret: secretInput },
      (res?: SetWordAck) => {
        setSecretLoading(false);
        if (res?.ok) {
          setSecretError(null);
          setSecretInput("");
        } else {
          setSecretError(res?.error || "Unable to set word.");
        }
      },
    );
  }, [isHost, roomId, secretInput, socket]);

  const handleStartBattle = useCallback(() => {
    if (!isHost || !roomId) return;
    setStartLoading(true);
    socket.emit(
      "startBattle",
      { roomId },
      (res?: StartBattleAck) => {
        setStartLoading(false);
        if (!res?.ok) {
          setSecretError(res?.error || "Unable to start round.");
        } else {
          setSecretError(null);
        }
      },
    );
  }, [isHost, roomId, socket]);

  const handleResetRound = useCallback(() => {
    if (!isHost || !roomId) return;
    setResetLoading(true);
    socket.emit(
      "playAgain",
      { roomId },
      (res?: ResetAck) => {
        setResetLoading(false);
        if (!res?.ok) {
          setSecretError(res?.error || "Unable to reset round.");
        }
      },
    );
  }, [isHost, roomId, socket]);

  if (!room) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <Text className="text-sm text-neutral-500">Connecting to room...</Text>
      </SafeAreaView>
    );
  }

  const canStartRound = !!room.battle?.hasSecret && playerCount >= 1;
  const showResults = !!room.battle?.winner;

  const hostControlsCard = (
    <View className="bg-white border border-neutral-200 rounded-2xl p-4 mt-4">
      <Text className="text-base font-semibold text-neutral-800">Set the next secret word</Text>
      <Text className="text-xs text-neutral-500 mt-1">
        Enter a 5-letter word and start the next battle when everyone's ready.
      </Text>

      <View className="flex-row justify-center gap-2 mt-4">
        {Array.from({ length: WORD_LENGTH }).map((_, idx) => {
          const letter = secretInput[idx] ?? "";
          return (
            <View
              key={idx}
              className="w-12 h-14 rounded-xl border items-center justify-center"
              style={{
                borderColor: letter ? "#4338ca" : "rgba(17,24,39,0.12)",
                backgroundColor: letter ? "rgba(67,56,202,0.06)" : "#fff",
              }}
            >
              <Text className="text-xl font-bold text-neutral-800">{letter}</Text>
            </View>
          );
        })}
      </View>

      <TextInput
        value={secretInput}
        onChangeText={handleSecretChange}
        maxLength={WORD_LENGTH}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="TYPE"
        className="mt-4 text-center text-lg font-semibold tracking-[4px] text-neutral-700 bg-neutral-100 rounded-xl py-3"
      />

      {secretError ? (
        <Text className="text-xs text-red-500 mt-2 text-center">{secretError}</Text>
      ) : (
        <Text className="text-xs text-neutral-400 mt-2 text-center">
          Word is kept private; players see only their tiles.
        </Text>
      )}

      <View className="flex-row mt-4 gap-3">
        <Pressable
          onPress={handleSecretSubmit}
          disabled={secretLoading || !secretReady}
          className="flex-1 rounded-xl py-3 items-center"
          style={{ backgroundColor: secretReady && !secretLoading ? "#4f46e5" : "#a5b4fc" }}
        >
          <Text className="text-white font-semibold text-sm">
            {secretLoading ? "Saving..." : "Save Word"}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleStartBattle}
          disabled={startLoading || !canStartRound}
          className="flex-1 rounded-xl py-3 items-center"
          style={{ backgroundColor: canStartRound && !startLoading ? "#059669" : "#6ee7b7" }}
        >
          <Text className="text-white font-semibold text-sm">
            {startLoading ? "Starting..." : "Start Round"}
          </Text>
        </Pressable>
      </View>

      <Text className="text-xs text-neutral-500 mt-3 text-center">
        {playerCount < 1
          ? "Need at least one opponent to start."
          : room.battle?.hasSecret
          ? "Start the round when everyone is ready."
          : "Save a word to enable Start Round."}
      </Text>

      <Pressable
        onPress={handleResetRound}
        disabled={resetLoading}
        className="mt-3 rounded-xl border border-neutral-200 py-2.5 items-center"
      >
        <Text className="text-xs font-semibold text-neutral-500">
          {resetLoading ? "Resetting..." : "Clear current round state"}
        </Text>
      </Pressable>

      <View className="mt-3">
        <Text className="text-xs text-neutral-500">
          Players in lobby: {playerCount} {playerCount === 1 ? "player" : "players"}
        </Text>
        {room.battle?.lastRevealedWord ? (
          <Text className="text-xs text-neutral-400 mt-1">
            Last word: {room.battle.lastRevealedWord.toUpperCase()}
          </Text>
        ) : null}
      </View>
    </View>
  );

  const rosterCard = (
    <View className="bg-white border border-neutral-200 rounded-2xl p-4 mt-4">
      <Text className="text-base font-semibold text-neutral-800">Players</Text>
      <ScrollView
        style={{ maxHeight: 220 }}
        contentContainerStyle={{ paddingVertical: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {spectateTargets.length === 0 ? (
          <Text className="text-sm text-neutral-500 text-center mt-6">
            No opponents yet. Share the room code to invite players.
          </Text>
        ) : (
          spectateTargets.map((player) => (
            <View
              key={player.id}
              className="flex-row items-center justify-between py-2 border-b border-neutral-100"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-9 h-9 rounded-full bg-neutral-200 items-center justify-center">
                  <Text className="text-sm font-semibold text-neutral-700">
                    {getAvatarToken(player.name)}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm font-semibold text-neutral-800" numberOfLines={1}>
                    {player.name || "Player"}
                  </Text>
                  <Text className="text-xs text-neutral-500">
                    W:{player.wins ?? 0} - Streak:{player.streak ?? 0}
                  </Text>
                </View>
              </View>
              <View
                className={["w-2 h-2 rounded-full", player.disconnected ? "bg-red-400" : "bg-emerald-400"].join(" ")}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  if (showResults) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <GameResults
            room={room}
            players={players}
            correctWord={room.battle?.lastRevealedWord}
            excludeHostFromTable
          />
          {isHost ? (
            <View className="px-4">
              {hostControlsCard}
              {rosterCard}
            </View>
          ) : (
            <View className="px-4 mt-6">
              <View className="bg-white border border-neutral-200 rounded-2xl p-4 items-center">
                <Text className="text-sm text-neutral-600 text-center">
                  Waiting for host to set the next word...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!room.battle?.started) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}>
          <View className="mt-4 items-center">
            <Text className="text-lg font-semibold text-neutral-800">Battle Lobby</Text>
            <Text className="text-sm text-neutral-500 mt-1">{stageMessage}</Text>
          </View>
          {isHost ? hostControlsCard : null}
          {rosterCard}
          {!isHost ? (
            <View className="bg-white border border-neutral-200 rounded-2xl p-4 mt-4">
              <Text className="text-sm text-neutral-600 text-center">
                Waiting for the host to set the secret word and start the round...
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="flex-1 px-4 pt-2 pb-3">
        <BattleProgressStrip
          players={stripPlayers}
          style={{ marginTop: 4 }}
          selectedId={isHost ? resolvedSpectateTargetId ?? undefined : undefined}
          onSelect={isHost ? handleSpectateSelect : undefined}
        />

        <View className="items-center mt-3">
          <Text className="text-xs text-neutral-500">{stageMessage}</Text>
          {isHost && viewingPlayer ? (
            <Text className="text-xs text-neutral-600 mt-1">
              Viewing {viewingPlayer.name || "player"}'s board
            </Text>
          ) : null}
          {!isHost ? (
            <Text className="text-xs text-neutral-500 mt-1">
              {me?.done ? "No guesses left." : `Guesses left: ${guessesLeft}`}
            </Text>
          ) : null}
        </View>

        <Animated.View
          style={{
            flex: 1,
            marginTop: 12,
            transform: [{ translateX: shakeTranslate }],
          }}
        >
          <View className="flex-1 justify-center items-center px-2">
            <WordleBoard
              guesses={activeBoard}
              rowCount={MAX_GUESSES}
              columnCount={WORD_LENGTH}
              gap={5}
              revealRowIndex={
                viewingPlayer?.guesses && viewingPlayer.guesses.length > 0
                  ? viewingPlayer.guesses.length - 1
                  : null
              }
            />
          </View>
        </Animated.View>

        {isHost ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 2 }}
            style={{ maxHeight: 200 }}
          >
            {hostBoardEntries.length === 0 ? (
              <View className="w-full items-center justify-center py-6">
                <Text className="text-xs text-neutral-500">No players to spectate yet.</Text>
              </View>
            ) : (
              hostBoardEntries.map(({ player, board }) => (
                <Pressable
                  key={player.id}
                  onPress={() => handleSpectateSelect(player.id)}
                  className="mr-3 w-56 bg-white border rounded-2xl p-3"
                  style={{
                    borderColor:
                      resolvedSpectateTargetId === player.id ? "#6366f1" : "rgba(17,24,39,0.12)",
                    shadowColor: resolvedSpectateTargetId === player.id ? "#6366f1" : "transparent",
                    shadowOpacity: resolvedSpectateTargetId === player.id ? 0.2 : 0,
                    shadowRadius: resolvedSpectateTargetId === player.id ? 6 : 0,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm font-semibold text-neutral-800" numberOfLines={1}>
                      {player.name || "Player"}
                    </Text>
                    <Text className="text-xs text-neutral-500">
                      {(player.guesses?.length ?? 0)}/{MAX_GUESSES}
                    </Text>
                  </View>
                  <WordleBoard
                    guesses={board}
                    rowCount={MAX_GUESSES}
                    columnCount={WORD_LENGTH}
                    gap={3}
                  />
                </Pressable>
              ))
            )}
          </ScrollView>
        ) : (
          <View style={{ height: KEYBOARD_HEIGHT, justifyContent: "flex-end" }}>
            {guessError ? (
              <Text className="text-xs text-red-500 text-center mb-2">{guessError}</Text>
            ) : null}
            <GameKeyboard
              onKeyPress={handleKeyPress}
              enterStatus={enterStatus}
              disabled={!canGuess || guessLoading}
              letterStates={deriveKeyboardStates(me)}
            />
          </View>
        )}
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
      states: Array.from({ length: WORD_LENGTH }, (_, i) =>
        i < pendingGuess.length ? ("tbd" as GuessPattern) : ("empty" as GuessPattern),
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

function deriveStageMessage({
  room,
  players,
  me,
  socketId,
  isHost,
}: {
  room: BattleRoomState | null;
  players: BattlePlayer[];
  me?: BattlePlayer;
  socketId: string | null;
  isHost: boolean;
}) {
  if (!room) return "Connecting to room...";
  if (!socketId) return "Connecting...";
  if (!players.length) {
    return isHost ? "Share the code so players can join." : "Waiting for opponents to join.";
  }
  if (room.battle?.winner) {
    return "Round finished.";
  }
  if (!room.battle?.hasSecret) {
    return isHost
      ? "Set a secret word to start the battle."
      : "Waiting for host to set a secret word.";
  }
  if (!room.battle?.started) {
    return isHost
      ? "Start the round when everyone's ready."
      : "Waiting for host to start the round.";
  }
  if (isHost) {
    return "Spectating live boards.";
  }
  if (me?.done) {
    return "You're out of guesses.";
  }
  return "Guess the host's word!";
}

function getAvatarToken(name?: string) {
  if (!name) return "?";
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

