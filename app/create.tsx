import NavHeader from "@/components/NavHeader";
import { getSocket } from "@/lib/socket";
import { useTheme } from "@/providers/ThemeProvider";
import { Feather, Fontisto } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Player = {
  id: string;
  name?: string;
  wins?: number;
  streak?: number;
  disconnected?: boolean;
};

type RoomState = {
  id: string;
  mode: "duel" | "battle";
  hostId?: string;
  players: Record<string, Player>;
  battle: {
    started: boolean;
    winner: string | null;
    hasSecret: boolean;
    secret: null;
    lastRevealedWord: string | null;
  };
};

type ResumeAck = { ok?: boolean; error?: string };
type RoomResponse = { roomId?: string; error?: string };
type StartAck = { ok?: boolean; error?: string };
type ResetAck = { ok?: boolean; error?: string };
type SyncResponse = { ok?: boolean; error?: string; state?: RoomState };

type SearchParams = {
  name?: string;
  autoCreate?: string;
  roomId?: string;
  hostId?: string;
};

export default function Create() {
  const socket = useMemo(() => getSocket(), []);
  const theme = useTheme();
  const { colors } = theme;
  const { name: nameParam, autoCreate, roomId: roomParam, hostId: hostParam } =
    useLocalSearchParams<SearchParams>();

  const [name, setName] = useState(nameParam || "Host");
  const [word, setWord] = useState("");
  const [creating, setCreating] = useState(false);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [roomId, setRoomId] = useState<string>(typeof roomParam === "string" ? roomParam : "");
  const [socketId, setSocketId] = useState<string | null>(socket.id ?? null);
  const resumeAttemptedRef = useRef(false);

  useEffect(() => {
    const hydrate = () => {
      if (!roomId) return;
      socket.emit("syncRoom", { roomId }, (res?: SyncResponse) => {
        if (res?.ok && res.state) {
          setRoom(res.state);
          if (res.state.id) {
            setRoomId((prev) => (res.state.id !== prev ? res.state.id : prev));
          }
        } else if (res?.error) {
          console.warn("[create] syncRoom failed", res.error);
        }
      });
    };

    if (!socket.connected) socket.connect();

    const handleConnect = () => {
      setSocketId(socket.id ?? null);
      hydrate();
    };

    const handleDisconnect = () => setSocketId(null);

    const handleRoomState = (state: RoomState) => {
      setRoom(state);
      if (state.id) {
        setRoomId((prev) => (state.id !== prev ? state.id : prev));
      }
    };

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
    if (resumeAttemptedRef.current) return;
    if (!roomParam || !hostParam) return;
    if (!socketId) return;

    if (socketId === hostParam) {
      resumeAttemptedRef.current = true;
      return;
    }

    resumeAttemptedRef.current = true;
    socket.emit(
      "resume",
      { roomId: roomParam, oldId: hostParam },
      (res?: ResumeAck) => {
        if (res?.ok) {
          socket.emit("syncRoom", { roomId: roomParam }, (sync?: SyncResponse) => {
            if (sync?.ok && sync.state) {
              setRoom(sync.state);
              if (sync.state.id) {
                setRoomId((prev) => (sync.state.id !== prev ? sync.state.id : prev));
              }
            } else if (sync?.error) {
              console.warn("[create] syncRoom after resume failed", sync.error);
            }
          });
        } else {
          console.warn("[create] resume failed", res?.error);
          resumeAttemptedRef.current = false;
        }
      },
    );
  }, [socket, roomParam, hostParam, socketId]);

  useEffect(() => {
    if (autoCreate === "true" && !roomId && !creating) {
      handleCreateRoom();
    }
  }, [autoCreate, creating, roomId]);

  useEffect(() => {
    if (typeof roomParam === "string" && roomParam && roomParam !== roomId) {
      setRoomId(roomParam);
    }
  }, [roomParam, roomId]);

  const allPlayers = useMemo(() => Object.values(room?.players ?? {}), [room?.players]);
  const players = useMemo(
    () => allPlayers.filter((player) => player.id !== room?.hostId),
    [allPlayers, room?.hostId],
  );
  const playerCount = players.length;

  const handleCreateRoom = () => {
    if (creating) return;
    setCreating(true);
    socket.emit(
      "createRoom",
      { name: name || "Host", mode: "battle" },
      (res?: RoomResponse) => {
        if (!res?.roomId) {
          setCreating(false);
          alert(res?.error || "Failed to create room");
          return;
        }
        setRoomId(res.roomId);
        setCreating(false);
      },
    );
  };

  const ensureHost = (action: string) => {
    if (room?.hostId && socketId && room.hostId !== socketId) {
      alert(`Only the host can ${action}. If you are the host, please rejoin the room.`);
      return false;
    }
    return true;
  };

  const handleStartGame = () => {
    if (!roomId) {
      alert("No room created yet");
      return;
    }
    if (!word || word.length !== 5) {
      alert("Please enter a 5-letter word");
      return;
    }
    if (!ensureHost("set the word")) return;

    socket.emit(
      "setHostWord",
      { roomId, secret: word.toUpperCase() },
      (res?: StartAck) => {
        if (res?.ok) {
          socket.emit(
            "startBattle",
            { roomId },
            (startRes?: StartAck) => {
              if (startRes?.ok) {
                router.push(`/game-start?roomId=${roomId}`);
              } else {
                alert(startRes?.error || "Failed to start battle");
              }
            },
          );
        } else {
          alert(res?.error || "Invalid word");
        }
      },
    );
  };

  const handlePlayAgain = () => {
    if (!roomId) {
      alert("No room created yet");
      return;
    }
    if (!ensureHost("reset the round")) return;

    socket.emit("playAgain", { roomId }, (res?: ResetAck) => {
      if (res?.ok) {
        setWord("");
      } else {
        alert(res?.error || "Failed to reset game");
      }
    });
  };

  const copyRoomCode = () => {
    if (!roomId) return;
    alert(`Room code copied: ${roomId}`);
  };

  if (room && room.battle.started && room.battle.winner) {
    const nonHostPlayers = Object.values(room.players).filter((player) => player.id !== room.hostId);

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <NavHeader greetingName={name} />

        <View className="flex-1 px-4 pt-2">
          <View className="items-center mb-8">
            <Text className="text-2xl font-bold text-gray-800">Battle Royale</Text>
            {room.battle.winner && (
              <Text className="text-lg text-blue-600 font-semibold mt-1">
                Winner: {room.players[room.battle.winner]?.name || "Unknown"}
              </Text>
            )}
          </View>

          <View className="items-center mb-8">
            <View className="flex-row items-center gap-2 mb-4">
              <Text className="text-lg">??</Text>
              <Text className="text-lg font-semibold text-gray-700">Round Results</Text>
            </View>

            {room.battle.lastRevealedWord && (
              <View className="flex-row gap-2 mb-6">
                {room.battle.lastRevealedWord
                  .toUpperCase()
                  .split("")
                  .map((letter, i) => (
                    <View
                      key={i}
                      className="w-12 h-12 rounded border items-center justify-center"
                      style={{ backgroundColor: "#6AAA64", borderColor: "#6AAA64" }}
                    >
                      <Text className="text-white font-extrabold text-lg">{letter}</Text>
                    </View>
                  ))}
              </View>
            )}

            {room.battle.winner && (
              <View className="bg-white rounded-xl p-6 items-center shadow-sm mb-6">
                <Text className="text-2xl mb-2">??</Text>
                <Text className="text-xl mb-1">??</Text>
                <Text className="text-xl font-bold text-gray-800 mb-1">
                  {room.players[room.battle.winner]?.name || "Unknown"}
                </Text>
                <Text className="text-sm text-gray-500">1</Text>
              </View>
            )}
          </View>

          <View className="bg-white rounded-xl p-6">
            <Text className="text-lg font-semibold text-gray-700 text-center mb-4">
              Enter a word to start the game
            </Text>

            <View className="flex-row gap-2 justify-center mb-4">
              {Array.from({ length: 5 }, (_, i) => (
                <TextInput
                  key={i}
                  className="w-12 h-12 rounded border text-center text-lg font-bold"
                  style={{
                    backgroundColor: i === 0 ? colors.surface : colors.surfaceElevated,
                    borderColor: i === 0 ? colors.accent : colors.border,
                    color: colors.text,
                  }}
                  value={word[i] || ""}
                  onChangeText={(text) => {
                    if (text.length <= 1 && /^[A-Za-z]*$/.test(text)) {
                      const next = word.split("");
                      next[i] = text.toUpperCase();
                      setWord(next.join("").slice(0, 5));
                    }
                  }}
                  maxLength={1}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              ))}
            </View>

            <View className="flex-row items-center justify-center gap-2 mb-4">
              <Pressable
                onPress={() => alert("Generate word feature coming soon!")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: colors.surfaceElevated,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 18, color: colors.text }}>?</Text>
                <Text style={{ color: colors.accent, fontWeight: "500" }}>Generate</Text>
              </Pressable>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>Enter 5-letter word</Text>
            </View>

            <Pressable
              onPress={handleStartGame}
              style={{
                borderRadius: 8,
                height: 64,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: word.length === 5 ? colors.success : colors.surfaceElevated,
                opacity: word.length === 5 ? 1 : 0.6,
              }}
              disabled={word.length !== 5}
            >
              <Text style={{ 
                fontWeight: "bold", 
                color: word.length === 5 ? colors.textOnAccent : colors.textMuted 
              }}>
                Start Game
              </Text>
            </Pressable>
          </View>

          <View style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            marginTop: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: "600", 
              color: colors.text, 
              marginBottom: 12 
            }}>
              Players ({nonHostPlayers.length}/6)
            </Text>

            {nonHostPlayers.map((player, index) => (
              <View
                key={player.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 8,
                  borderBottomWidth: index === nonHostPlayers.length - 1 ? 0 : 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{
                    width: 32,
                    height: 32,
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                      {(player.name || "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ color: colors.text, fontWeight: "500" }}>{player.name || "Unknown"}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                  <Text style={{ fontSize: 14, color: colors.textMuted }}>W:{player.wins || 0}</Text>
                  <Text style={{ fontSize: 14, color: colors.textMuted }}>S:{player.streak || 0}</Text>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: player.disconnected ? "#ef4444" : colors.success,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView>
      <NavHeader greetingName={name} />
      <View style={{ minHeight: "100%", backgroundColor: colors.background, paddingHorizontal: 16 }}>
        <View className="space-x-3 justify-start px-4">
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Create a game room</Text>
          <Text style={{ color: colors.textMuted, fontSize: 16, fontWeight: "bold" }}>
            Tip: Share the room code with friends to play together
          </Text>
        </View>

        {roomId ? (
          <View className="flex-row gap-2 w-full px-4">
            <TextInput
              style={{
                width: "75%",
                backgroundColor: colors.surface,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 8,
                marginTop: 16,
                height: 64,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              placeholder="Room Code"
              placeholderTextColor={colors.textMuted}
              value={roomId}
              editable={false}
            />
            <Pressable
              onPress={copyRoomCode}
              style={{
                width: "25%",
                backgroundColor: colors.accent,
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 8,
                marginTop: 16,
                height: 64,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="copy" size={24} color={colors.textOnAccent} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            disabled={creating}
            onPress={handleCreateRoom}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 8,
              marginTop: 16,
              height: 64,
              alignItems: "center",
              justifyContent: "center",
              marginHorizontal: 16,
              opacity: creating ? 0.6 : 1,
            }}
          >
            <Text style={{ color: colors.textOnAccent, fontWeight: "bold" }}>
              {creating ? "Creating..." : "Create Room"}
            </Text>
          </Pressable>
        )}

        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600", marginTop: 16, paddingHorizontal: 16 }}>
          Enter a word to start the game
        </Text>

        <TextInput
          style={{
            backgroundColor: colors.surface,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 8,
            marginTop: 16,
            height: 64,
            marginHorizontal: 16,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          placeholder="Enter 5-letter word"
          placeholderTextColor={colors.textMuted}
          value={word}
          onChangeText={(text) => setWord(text.toUpperCase())}
          maxLength={5}
        />

        {roomId && (
          <View className="gap-2">
            <Pressable
              onPress={handleStartGame}
              className="bg-green-400 rounded-lg mt-4 h-16 items-center justify-center mx-4"
            >
              <Text className="text-white font-bold">Start Game</Text>
            </Pressable>

            {room?.battle?.winner && (
              <Pressable
                onPress={handlePlayAgain}
                className="bg-blue-400 rounded-lg h-16 items-center justify-center mx-4"
              >
                <Text className="text-white font-bold">Play Again</Text>
              </Pressable>
            )}
          </View>
        )}

        <Text className="text-red-400 mt-4 font-semibold px-4">
          WAIT FOR YOUR FRIENDS TO JOIN BEFORE YOU START THE GAME
        </Text>

        <View className="bg-gray-200 h-1 mt-4" />
        <View className="flex-row justify-between px-4">
          <Text className="text-lg font-semibold mt-4">PLAYERS</Text>
          <Text className="text-lg font-semibold mt-4">{playerCount}/6 ONLINE</Text>
        </View>

        {players.length === 0 ? (
          <View className="px-4 py-8">
            <Text className="text-gray-500 text-center">No players joined yet</Text>
          </View>
        ) : (
          players.map((player) => (
            <View key={player.id} className="w-full border-t-2 border-gray-400 mt-4 px-4">
              <View className="flex-row w-full mt-1 items-center gap-4">
                <Fontisto name="person" size={24} color="black" />
                <Text className="text-lg flex-1">{player.name || "Unknown"}</Text>
                <Text className="text-lg">W:{player.wins || 0}</Text>
                <Text className="text-lg">S:{player.streak || 0}</Text>
                <View
                  className={`w-3 h-3 rounded-full ${player.disconnected ? "bg-red-400" : "bg-green-400"}`}
                />
              </View>
            </View>
          ))
        )}
      </View>
    </SafeAreaView>
  );
}
