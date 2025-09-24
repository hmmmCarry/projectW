import GameKeyboard from "@/components/Keyboard";
import NavHeader from "@/components/NavHeader";
import ShareRoomModalCompat from "@/components/ShareRoomModalCompat";
import VictoryModal from "@/components/VictoryModal";
import WordleBoard from "@/components/WordleBoard";
import { getSocket } from "@/lib/socket";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PlayerPill from "./player-pill";

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

type GuessPattern = "correct" | "present" | "absent" | "tbd" | "empty";
type PlayerGuess = {
  guess: string;
  pattern?: GuessPattern[];
};

type DuelPlayer = {
  id: string;
  name?: string;
  ready?: boolean;
  guesses?: PlayerGuess[];
  done?: boolean;
  wins?: number;
  streak?: number;
  disconnected?: boolean;
  rematchRequested?: boolean;
};

type DuelRoomState = {
  id: string;
  mode: "duel" | "battle";
  hostId?: string;
  players: Record<string, DuelPlayer>;
  started?: boolean;
  winner?: string | "draw" | null;
  duelReveal?: Record<string, string>;
  duelDeadline?: number | null;
};

type GuessAck = { ok?: boolean; error?: string; pattern?: GuessPattern[] };
type SecretAck = { ok?: boolean; error?: string };
type RematchAck = { ok?: boolean; error?: string; bothRequested?: boolean };

type Params = {
  roomId?: string;
  name?: string;
  host?: string; // "1" for host, "0" for joiner
};

type ViewMode = "player" | "opponent";

type EnterStatus = "default" | "ready" | "disabled";

const KEYBOARD_HEIGHT = 260;

export default function DuelGameStart() {
  const router = useRouter();
  const socket = useMemo(() => getSocket(), []);

  const { roomId: roomParam, name: nameParam, host: hostParam } = useLocalSearchParams<Params>();
  const roomId = typeof roomParam === "string" ? roomParam : "";
  const initialName = typeof nameParam === "string" ? nameParam : undefined;
  const isHost = hostParam === "1";

  const [room, setRoom] = useState<DuelRoomState | null>(null);
  const [socketId, setSocketId] = useState<string | null>(socket.id ?? null);
  const [guess, setGuess] = useState("");
  const [guessError, setGuessError] = useState<string | null>(null);
  const [guessLoading, setGuessLoading] = useState(false);
  const [secretInput, setSecretInput] = useState("");
  const [secretError, setSecretError] = useState<string | null>(null);
  const [secretSubmitting, setSecretSubmitting] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [rematchStatus, setRematchStatus] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("player");
  const [showShare, setShowShare] = useState(false);
  const hasShownShareRef = useRef(false);

  const revealKeyRef = useRef<string | null>(null);
  const boardAnim = useRef(new Animated.Value(0)).current;
  const boardShake = useRef(new Animated.Value(0)).current;
  const shakeTranslate = boardShake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] });
  const [boardAreaSize, setBoardAreaSize] = useState({ width: 0, height: 0 });

  const handleBoardLayout = useCallback((e: LayoutChangeEvent) => {
    const { layout } = e.nativeEvent;
    const { width, height } = layout;
    if (width <= 0 || height <= 0) return;
    setBoardAreaSize({ width, height });
  }, []);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    const handleConnect = () => setSocketId(socket.id ?? null);
    const handleRoomState = (state: DuelRoomState) => setRoom(state);

    socket.on("connect", handleConnect);
    socket.on("roomState", handleRoomState);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("roomState", handleRoomState);
    };
  }, [socket]);

  useEffect(() => {
    const revealKey = room?.duelReveal ? Object.values(room.duelReveal).join("|") : null;

    if (room?.started) setRematchStatus(null);

    if (revealKey && revealKey !== revealKeyRef.current) {
      revealKeyRef.current = revealKey;
      setShowVictory(true);
      setGuess("");
    }

    if (!revealKey && room?.started) {
      setShowVictory(false);
    }

    if (!room?.started) {
      setGuessLoading(false);
    }
  }, [room?.duelReveal, room?.started]);

  // Auto-open share modal once for hosts, when room exists and before game start
  useEffect(() => {
    if (!isHost) return;
    if (!roomId) return;
    if (room?.started) return;
    if (hasShownShareRef.current) return;
    hasShownShareRef.current = true;
    const id = setTimeout(() => setShowShare(true), 0);
    return () => clearTimeout(id);
  }, [isHost, roomId, room?.started]);

  useEffect(() => {
    if (room?.duelDeadline) {
      const update = () => setRemainingMs(Math.max(0, room.duelDeadline! - Date.now()));
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }
    setRemainingMs(null);
    return undefined;
  }, [room?.duelDeadline]);

  useEffect(() => {
    Animated.timing(boardAnim, {
      toValue: viewMode === "opponent" ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [boardAnim, viewMode]);

  const players = useMemo(() => Object.values(room?.players ?? {}), [room?.players]);
  const me = socketId ? room?.players?.[socketId] : undefined;
  const opponent = players.find((p) => p.id !== socketId);

  const isEnteringSecret = !room?.started && !(me?.ready);
  const secretReady = isEnteringSecret && secretInput.length === WORD_LENGTH;
  const canGuess = !!room?.started && !!me && !me.done;
  const myBoard = useMemo(() => buildBoard(me, guess), [me, guess]);
  const oppBoard = useMemo(() => buildBoard(opponent), [opponent]);

  const handleBack = () => router.back();

  const triggerBoardShake = () => {
    boardShake.setValue(0);
    Animated.sequence([
      Animated.timing(boardShake, { toValue: 1, duration: 45, useNativeDriver: true }),
      Animated.timing(boardShake, { toValue: -1, duration: 45, useNativeDriver: true }),
      Animated.timing(boardShake, { toValue: 1, duration: 45, useNativeDriver: true }),
      Animated.timing(boardShake, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  };

  const handleSecretSubmit = () => {
    if (!roomId || !isEnteringSecret) return;
    if (!secretReady || secretSubmitting) {
      setSecretError(secretReady ? null : "Secret word must be 5 letters.");
      return;
    }

    setSecretSubmitting(true);
    setSecretError(null);

    socket.emit(
      "setSecret",
      { roomId, secret: secretInput.trim().toUpperCase() },
      (res?: SecretAck) => {
        setSecretSubmitting(false);
        if (res?.ok) {
          setSecretInput("");
          setSecretError(null);
        } else {
          setSecretError(res?.error || "Secret was rejected.");
        }
      },
    );
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

  const keyboardDisabled = viewMode === "opponent";

  const handleKeyPress = (key: string) => {
    if (keyboardDisabled) return;

    if (key === "ENTER") {
      if (isEnteringSecret) handleSecretSubmit();
      else handleGuessSubmit();
      return;
    }

    if (key === "BACKSPACE") {
      if (isEnteringSecret) {
        setSecretInput((prev) => prev.slice(0, -1));
        setSecretError(null);
      } else {
        setGuess((prev) => prev.slice(0, -1));
        setGuessError(null);
      }
      return;
    }

    if (!/^[A-Z]$/.test(key)) return;

    if (isEnteringSecret) {
      if (secretInput.length < WORD_LENGTH) {
        setSecretInput((prev) => (prev + key).slice(0, WORD_LENGTH));
        setSecretError(null);
      }
    } else if (canGuess && guess.length < WORD_LENGTH) {
      setGuess((prev) => (prev + key).slice(0, WORD_LENGTH));
      setGuessError(null);
    }
  };

  const handleRematch = () => {
    if (!roomId) return;
    socket.emit(
      "duelPlayAgain",
      { roomId },
      (res?: RematchAck) => {
        if (res?.ok) {
          if (res.bothRequested) {
            setRematchStatus(null);
            setShowVictory(false);
            setViewMode("player");
          } else {
            setRematchStatus("Waiting for opponent to accept a rematch...");
          }
        } else {
          setRematchStatus(res?.error || "Rematch failed.");
        }
      },
    );
  };

  const winnerInfo = deriveWinnerInfo({ room, me, opponent, socketId });
  const stageMessage = viewMode === "player" ? deriveStageMessage({ room, players, me, opponent }) : `Viewing ${opponent?.name || "opponent"}`;

  let enterStatus: EnterStatus = "default";
  if (keyboardDisabled) enterStatus = "disabled";
  else if (isEnteringSecret) enterStatus = secretReady ? "ready" : "disabled";
  else enterStatus = guess.length === WORD_LENGTH && canGuess ? "ready" : canGuess ? "default" : "disabled";

  const playerBoardStyle = {
    opacity: boardAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [
      { translateX: shakeTranslate },
      { translateX: boardAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -24] }) },
    ],
  };

  const opponentBoardStyle = {
    opacity: boardAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
    transform: [
      { translateX: boardAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
    ],
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <NavHeader title="Duel" showBack roomId={roomId || undefined} />
      <View className="flex-1 px-4 pt-2 pb-1">
        <View className="flex-row gap-3">
          <PlayerPill
            name={me?.name || initialName || "You"}
            avatar={getAvatarToken(me?.name || initialName)}
            wins={me?.wins ?? 0}
            streak={me?.streak ?? 0}
            online={!me?.disconnected}
            guessesCount={me?.guesses?.length ?? 0}
            maxGuesses={MAX_GUESSES}
            gridRows={2}
            gridCols={3}
            onPress={() => setViewMode("player")}
            active={viewMode === "player"}
            showProgressGrid={false}
          />
          <PlayerPill
            name={opponent?.name || "Opponent"}
            avatar={getAvatarToken(opponent?.name)}
            wins={opponent?.wins ?? 0}
            streak={opponent?.streak ?? 0}
            online={!!opponent && !opponent.disconnected}
            guessesCount={opponent?.guesses?.length ?? 0}
            maxGuesses={MAX_GUESSES}
            gridRows={3}
            gridCols={5}
            onPress={() => setViewMode("opponent")}
            active={viewMode === "opponent"}
          />
        </View>

        {viewMode === "player" && (
          <View className="mt-5">
            {secretError ? (
              <Text className="text-xs text-red-500 mt-2">{secretError}</Text>
            ) : isEnteringSecret ? (
              <Text className="text-xs text-neutral-500 mt-2">
                {secretReady ? "Press enter to lock your word." : "Choose your secret word."}
              </Text>
            ) : (
              <Text className="text-xs text-neutral-500 mt-2">Secret word locked.</Text>
            )}
            <SecretEntryRow
              value={secretInput}
              ready={secretReady}
              locked={!!me?.ready}
              error={secretError}
            />
          </View>
        )}

        {viewMode === "player" && guessError ? (
          <Text className="text-xs text-red-500 mt-3 text-center">{guessError}</Text>
        ) : null}

        <View style={{ flex: 1, marginTop: 8, position: "relative" }} onLayout={handleBoardLayout}>
          <Animated.View
            style={[{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, flex: 1 }, playerBoardStyle]}
            pointerEvents={viewMode === "player" ? "auto" : "none"}
          >
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <Text className="text-sm text-neutral-600 mb-2 text-center">{stageMessage}</Text>
              <Text className="text-2xl font-semibold text-neutral-800">{formatTimer(remainingMs)}</Text>
            </View>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 12 }}>
              <WordleBoard
                guesses={myBoard}
                maxWidth={boardAreaSize.width || undefined}
                maxHeight={boardAreaSize.height || undefined}
                gap={6}
              />
            </View>
            {rematchStatus ? (
              <Text className="text-xs text-neutral-500 mt-4 text-center">{rematchStatus}</Text>
            ) : null}
          </Animated.View>

          <Animated.View
            style={[{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, flex: 1 }, opponentBoardStyle]}
            pointerEvents={viewMode === "opponent" ? "auto" : "none"}
          >
            <View style={{ alignItems: "center", marginBottom: 16, marginTop: 4 }}>
              <Text className="text-sm text-neutral-600 mb-2 text-center">
                {opponent?.name ? `${opponent.name}'s board` : "Opponent board"}
              </Text>
              <Text className="text-xs text-neutral-500 text-center">
                Tap your pill to return to your guesses.
              </Text>
            </View>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 12 }}>
              <WordleBoard
                guesses={oppBoard}
                maxWidth={boardAreaSize.width || undefined}
                maxHeight={boardAreaSize.height || undefined}
                gap={6}
              />
            </View>
          </Animated.View>
        </View>
        </View>

      {viewMode === "player" ? (
        <View style={{ height: KEYBOARD_HEIGHT, justifyContent: "flex-end" }}>
          <GameKeyboard
            onKeyPress={handleKeyPress}
            enterStatus={enterStatus}
            disabled={keyboardDisabled || secretSubmitting}
          />
        </View>
      ) : null}

      <VictoryModal
        visible={showVictory && !!winnerInfo}
        onClose={() => setShowVictory(false)}
        onRematch={handleRematch}
        winnerName={winnerInfo?.winnerName || "No one"}
        winnerInitials={winnerInfo?.initials || "--"}
        winnerEmoji={winnerInfo?.emoji || "CUP"}
        isMeWinner={winnerInfo?.isMeWinner}
        correctWord={winnerInfo?.word || ""}
      />

      <ShareRoomModalCompat
        visible={showShare}
        onClose={() => setShowShare(false)}
        roomId={roomId}
        deepLink={`projectw://join/${roomId}`}
      />
    </SafeAreaView>
  );
}

type StageArgs = {
  room: DuelRoomState | null;
  players: DuelPlayer[];
  me?: DuelPlayer;
  opponent?: DuelPlayer;
};

function deriveStageMessage({ room, players, me, opponent }: StageArgs) {
  if (!room) return "Connecting to room...";
  if (players.length < 2) return "Waiting for an opponent to join.";
  if (!me?.ready) return "Choose your secret word to begin.";
  if (!opponent?.ready) return `${opponent?.name || "Opponent"} is picking a word.`;
  if (!room.started && !room.duelReveal) return "Waiting for guesses...";
  if (room.started) return "Guess your opponent's word!";
  if (room.winner === "draw") return "Round finished in a draw.";
  if (room.winner) return `${room.players[room.winner]?.name || "Opponent"} won the round.`;
  return "Round finished.";
}

type WinnerArgs = {
  room: DuelRoomState | null;
  me?: DuelPlayer;
  opponent?: DuelPlayer;
  socketId: string | null;
};

function deriveWinnerInfo({ room, me, opponent, socketId }: WinnerArgs) {
  if (!room?.duelReveal) return null;
  if (!room.winner) return null;

  const mySecret = socketId ? room.duelReveal[socketId] : undefined;
  const oppSecret = opponent?.id ? room.duelReveal[opponent.id] : undefined;

  if (room.winner === "draw") {
    return {
      winnerName: "No one",
      initials: "--",
      emoji: "DRAW",
      isMeWinner: false,
      word: oppSecret || mySecret || "",
    };
  }

  const winner = room.players?.[room.winner];
  const isMeWinner = socketId === room.winner;
  const winnerName = isMeWinner ? "You" : winner?.name || "Opponent";
  const initials = getInitials(winner?.name || winnerName);
  const emoji = isMeWinner ? "WIN" : "CUP";
  const word = isMeWinner ? oppSecret || "" : mySecret || "";

  return {
    winnerName,
    initials,
    emoji,
    isMeWinner,
    word,
  };
}

type SecretEntryProps = {
  value: string;
  ready: boolean;
  locked: boolean;
  error: string | null;
};

function SecretEntryRow({ value, ready, locked, error }: SecretEntryProps) {
  const letters = locked ? Array.from({ length: WORD_LENGTH }).map(() => "*") : value.padEnd(WORD_LENGTH, " ").split("");
  const borderColor = error ? "#ef4444" : ready ? "#4338ca" : "rgba(17,24,39,0.08)";

  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 10 }}>
      {letters.map((ch, idx) => (
        <View
          key={idx}
          style={{
            width: 54,
            height: 58,
            borderRadius: 14,
            borderWidth: 2,
            borderColor,
            backgroundColor: locked ? "#4338ca" : "#fff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "700", color: locked ? "#eef2ff" : "#111827" }}>{ch.trim()}</Text>
        </View>
      ))}
    </View>
  );
}

function buildBoard(player?: DuelPlayer, pendingGuess = "") {
  const guesses = player?.guesses ?? [];
  const rows = guesses.map((g) => ({ letters: g.guess || "", states: g.pattern }));
  if (pendingGuess && guesses.length < MAX_GUESSES) {
    rows.push({
      letters: pendingGuess.padEnd(WORD_LENGTH, " "),
      states: Array.from({ length: WORD_LENGTH }, (_, i) => (i < pendingGuess.length ? ("tbd" as GuessPattern) : ("empty" as GuessPattern))),
    });
  }
  return rows;
}

function formatTimer(ms: number | null) {
  if (ms == null) return "--:--";
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (total % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getInitials(name?: string) {
  if (!name) return "--";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return name.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function getAvatarToken(name?: string) {
  if (!name) return "?";
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}
