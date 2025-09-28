import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { FlatList, Text, View } from "react-native";

/** Types that match your web payload */
type Guess = { guess: string; pattern?: string[] };
type Player = {
  id: string;
  name?: string;
  guesses?: Guess[];
  wins?: number;
  streak?: number;
  disconnected?: boolean;
};
type Room = {
  hostId?: string | null;
  battle?: { winner?: string | null };
};

type Props = {
  room: Room;
  players: Player[];
  /** use the already-resolved word for the last round (e.g., lastRevealedWord) */
  correctWord?: string | null;
  /** battle excludes host from the table; duel can include both */
  excludeHostFromTable?: boolean;
};

export default function GameResults({
  room,
  players = [],
  correctWord,
  excludeHostFromTable = true,
}: Props) {
  const winnerId = room?.battle?.winner ?? null;
  const roundFinished = !!winnerId || !!correctWord;

  /** Per-round stats (optionally exclude host) */
  const results = useMemo(() => {
    const word = (correctWord || "").toUpperCase();
    return players
      .filter((p) => p && p.id && (!excludeHostFromTable || p.id !== room?.hostId))
      .map((p) => {
        const guesses = Array.isArray(p.guesses) ? p.guesses : [];
        const ix =
          word && guesses.length
            ? guesses.findIndex((g) => (g?.guess || "").toUpperCase() === word)
            : -1;
        const steps = ix >= 0 ? ix + 1 : null;
        return {
          id: p.id,
          name: p.name || "—",
          guesses: guesses.length,
          solved: steps !== null,
          steps,
          wins: p.wins ?? 0,
          streak: p.streak ?? 0,
          disconnected: !!p.disconnected,
        };
      });
  }, [players, correctWord, room?.hostId, excludeHostFromTable]);

  /** Sort for podium/table (winner first, then solved/steps, then fewer guesses) */
  const sorted = useMemo(() => {
    const copy = [...results];
    copy.sort((a, b) => {
      if (winnerId) {
        if (a.id === winnerId && b.id !== winnerId) return -1;
        if (b.id === winnerId && a.id !== winnerId) return 1;
      }
      if (a.solved !== b.solved) return a.solved ? -1 : 1;
      if (a.solved && b.solved) return (a.steps ?? 999) - (b.steps ?? 999);
      return a.guesses - b.guesses;
    });
    return copy;
  }, [results, winnerId]);

  const podium = sorted.slice(0, 3);

  return (
    <View className="w-full px-4 pt-2">
      {/* Winner announcement */}
      {winnerId && (
        <View className="items-center mb-4">
          <View className="flex-row items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-800">
            <Ionicons name="trophy" size={20} color="#f59e0b" />
            <Text className="text-base font-bold text-amber-800 dark:text-amber-200">
              {players.find(p => p.id === winnerId)?.name || "Unknown Player"} Won this round!
            </Text>
          </View>
        </View>
      )}

      {/* Header strip */}
      <View className="items-center mb-3">
        {roundFinished ? (
          <View className="flex-row items-center gap-2">
            <Ionicons name="trophy" size={16} color="#f59e0b" />
            <Text className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              Round Results
            </Text>
          </View>
        ) : (
          <Text className="text-xs text-neutral-500">
            Waiting for host to start…
          </Text>
        )}
      </View>

      {/* Revealed word tiles */}
      {!!correctWord && (
        <View className="items-center mb-3">
          <View className="flex-row gap-1.5">
            {correctWord
              .toUpperCase()
              .padEnd(5, " ")
              .slice(0, 5)
              .split("")
              .map((ch, i) => (
                <View
                  key={i}
                  className="w-10 h-12 rounded border items-center justify-center"
                  style={{
                    backgroundColor: "#6AAA64",
                    borderColor: "#6AAA64",
                  }}
                >
                  <Text className="text-white font-extrabold text-base">
                    {ch.trim()}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      )}

      {/* Podium */}
      {podium.length > 0 && (
        <View className="flex-row items-end justify-center gap-2 mb-4">
          {/* 2nd */}
          {podium[1] ? (
            <PodiumSlot
              place="2"
              name={podium[1].name}
              steps={podium[1].solved ? podium[1].steps ?? undefined : undefined}
              baseHeight={24}
            />
          ) : (
            <View className="w-24" />
          )}
          {/* 1st */}
          <PodiumSlot
            place="1"
            name={podium[0].name}
            steps={podium[0].solved ? podium[0].steps ?? undefined : undefined}
            baseHeight={36}
            crown
          />
          {/* 3rd */}
          {podium[2] ? (
            <PodiumSlot
              place="3"
              name={podium[2].name}
              steps={podium[2].solved ? podium[2].steps ?? undefined : undefined}
              baseHeight={18}
            />
          ) : (
            <View className="w-24" />
          )}
        </View>
      )}

      {/* Leaderboard */}
      <View className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        {/* Header row */}
        <View className="flex-row bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 px-3 py-2">
          <Text className="flex-1 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
            Player
          </Text>
          <Text className="w-14 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
            Round
          </Text>
          <Text className="w-12 text-center text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
            Wins
          </Text>
          <Text className="w-12 text-center text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
            Streak
          </Text>
        </View>

        <FlatList
          data={sorted}
          keyExtractor={(it) => it.id}
          style={{ maxHeight: 360 }}
          renderItem={({ item }) => (
            <View
              className={[
                "flex-row items-center px-3 py-2 border-b border-neutral-200 dark:border-neutral-800",
                item.disconnected ? "opacity-60" : "",
              ].join(" ")}
              style={{
                backgroundColor:
                  item.id === winnerId ? "rgba(245, 158, 11, 0.08)" : undefined,
              }}
            >
              <View className="flex-1 flex-row items-center gap-2">
                <View
                  className={[
                    "w-1.5 h-1.5 rounded-full",
                    item.id === winnerId
                      ? "bg-amber-500"
                      : item.solved
                      ? "bg-emerald-500"
                      : "bg-neutral-300",
                  ].join(" ")}
                />
                <Text
                  className="text-[13px] text-neutral-800 dark:text-neutral-100"
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </View>

              <Text className="w-14 text-[12px] text-neutral-700 dark:text-neutral-300">
                {item.solved ? item.steps : item.guesses}
              </Text>

              <Chip value={String(item.wins)} tone="green" />
              <Chip value={String(item.streak || 0)} tone="indigo" />
            </View>
          )}
          ListEmptyComponent={
            <View className="py-6 items-center">
              <Text className="text-xs text-neutral-500">No players yet.</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

/** Small helper: podium card + base */
function PodiumSlot({
  place,
  name,
  steps,
  baseHeight,
  crown,
}: {
  place: "1" | "2" | "3";
  name: string;
  steps?: number;
  baseHeight: number;
  crown?: boolean;
}) {
  const medalLabel = place === "1" ? "#1" : place === "2" ? "#2" : "#3";
  const accent = place === "1" ? "#f59e0b" : place === "2" ? "#94a3b8" : "#f97316";
  const stepsLabel = steps != null ? `${steps} ${steps === 1 ? "step" : "steps"}` : "-";
  return (
    <View className="items-center">
      <View className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 items-center mb-1.5">
        {crown ? (
          <Ionicons name="crown" size={18} color="#fbbf24" style={{ marginBottom: 4 }} />
        ) : (
          <View style={{ height: 18, marginBottom: 4 }} />
        )}
        <Text className="text-base font-semibold" style={{ color: accent }}>
          {medalLabel}
        </Text>
        <Text
          className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 max-w-[120px]"
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text className="text-[11px] text-neutral-500 mt-0.5">{stepsLabel}</Text>
      </View>
      <View
        className="w-24 rounded-t-xl border-t-2 border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800"
        style={{ height: baseHeight }}
      />
    </View>
  );
}

/** tiny pill for wins/streak */
function Chip({ value, tone }: { value: string; tone: "green" | "indigo" }) {
  const bg = tone === "green" ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-indigo-50 dark:bg-indigo-900/20";
  const border =
    tone === "green" ? "border-emerald-200 dark:border-emerald-800" : "border-indigo-200 dark:border-indigo-800";
  const text =
    tone === "green" ? "text-emerald-700 dark:text-emerald-300" : "text-indigo-700 dark:text-indigo-300";
  return (
    <View className={`w-12 items-center ${bg} ${border} border rounded px-1 py-0.5 ml-2`}>
      <Text className={`text-[11px] font-semibold ${text}`}>{value}</Text>
    </View>
  );
}

