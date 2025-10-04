import NavHeader from "@/components/NavHeader";
import { getSocket } from "@/lib/socket";
import { useTheme } from "@/providers/ThemeProvider";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Duel() {
  const router = useRouter();
  const socket = useMemo(() => getSocket(), []);
  const theme = useTheme();
  const { colors } = theme;

  const [displayName, setDisplayName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    const handleConnect = () => setStatus(null);
    const handleError = (err: Error) => {
      setError(err.message || "Connection error");
      setLoading(null);
    };
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleError);
    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleError);
    };
  }, [socket]);

  const ensureName = () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError("Enter a display name first.");
      return null;
    }
    return trimmed;
  };

  const handleCreate = () => {
    const name = ensureName();
    if (!name || loading) return;
    setError(null);
    setStatus(null);
    setLoading("create");
    socket.emit(
      "createRoom",
      { name, mode: "duel" },
      (res?: { roomId?: string; error?: string }) => {
        setLoading(null);
        if (res?.roomId) {
          setStatus(`Room ${res.roomId} created.`);
          router.push({
            pathname: "/duel-game-start",
            params: {
              roomId: res.roomId,
              name,
              host: "1",
            },
          });
        } else {
          setError(res?.error || "Could not create room.");
        }
      }
    );
  };

  const handleJoin = () => {
    const name = ensureName();
    if (!name || loading) return;
    const code = joinCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      setError("Enter a valid room code.");
      return;
    }
    setError(null);
    setStatus(null);
    setLoading("join");
    socket.emit(
      "joinRoom",
      { name, roomId: code },
      (res?: { ok?: boolean; error?: string }) => {
        setLoading(null);
        if (res?.ok) {
          setStatus(`Joined ${code}.`);
          router.push({
            pathname: "/duel-game-start",
            params: {
              roomId: code,
              name,
              host: "0",
            },
          });
        } else {
          setError(res?.error || "Could not join room.");
        }
      }
    );
  };

  return (
    <SafeAreaView>
      <View style={{ backgroundColor: colors.background, paddingHorizontal: 16, paddingBottom: 24 }}>
        <NavHeader />

        <View className="flex-row items-center space-x-3 justify-start mt-4">
          <MaterialCommunityIcons name="sword-cross" size={24} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>Duel (1x1)</Text>
        </View>

        <View className="mt-5">
          <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 4 }}>Display name</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            style={{
              width: "100%",
              backgroundColor: colors.surface,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 12,
              height: 48,
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            placeholder="How should other players see you?"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            maxLength={18}
          />
        </View>

        <View className="flex-row gap-2 w-full mt-4">
          <TextInput
            value={joinCode}
            onChangeText={(txt) => setJoinCode(txt.toUpperCase())}
            style={{
              width: "75%",
              backgroundColor: colors.surface,
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 8,
              height: 64,
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            placeholder="Enter code to join game room"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
          />
          <Pressable
            onPress={handleJoin}
            disabled={loading === "join"}
            style={{
              width: "25%",
              borderRadius: 8,
              paddingHorizontal: 8,
              marginTop: 0,
              height: 64,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: loading === "join" ? colors.surfaceElevated : colors.accent,
              opacity: loading === "join" ? 0.6 : 1,
            }}
          >
            <Text style={{ color: colors.textOnAccent, fontWeight: "bold" }}>
              {loading === "join" ? "Joining" : "Join"}
            </Text>
          </Pressable>
        </View>

        <View style={{ backgroundColor: colors.border, height: 4, marginTop: 16, borderRadius: 2 }} />

        <Pressable
          onPress={handleCreate}
          disabled={loading === "create"}
          style={{
            borderRadius: 8,
            marginTop: 16,
            height: 64,
            alignItems: "center",
            justifyContent: "center",
            marginHorizontal: 16,
            backgroundColor: loading === "create" ? colors.surfaceElevated : colors.accent,
            opacity: loading === "create" ? 0.6 : 1,
          }}
        >
          <Text style={{ color: colors.textOnAccent, fontWeight: "bold" }}>
            {loading === "create" ? "Creating" : "Create Room"}
          </Text>
        </Pressable>

        {(error || status) && (
          <View style={{ marginTop: 16, paddingHorizontal: 8 }}>
            {error ? (
              <Text style={{ fontSize: 14, color: "#ef4444" }}>{error}</Text>
            ) : null}
            {status ? (
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{status}</Text>
            ) : null}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
