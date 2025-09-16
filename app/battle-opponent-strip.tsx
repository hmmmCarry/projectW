import React from "react";
import { FlatList, View, ViewStyle } from "react-native";
import BattleOpponentChip, { BattleChipPlayer } from "./battle-opponent-chip";

type Props = {
  players: BattleChipPlayer[];
  style?: ViewStyle;
  tone?: "light" | "dark";
};

export default function BattleProgressStrip({ players, style, tone = "light" }: Props) {
  return (
    <View style={[{ paddingHorizontal: 8 }, style]}>
      <FlatList
        data={players}
        keyExtractor={(p) => p.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
        ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
        renderItem={({ item }) => (
          <BattleOpponentChip player={item} tone={tone} />
        )}
        // pills auto-size themselves; no extra press handlers here (visual only)
      />
    </View>
  );
}
