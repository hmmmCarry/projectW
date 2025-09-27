import React from "react";
import { FlatList, View, ViewStyle } from "react-native";
import BattleOpponentChip, { BattleChipPlayer } from "./battle-opponent-chip";

type Props = {
  players: BattleChipPlayer[];
  style?: ViewStyle;
  tone?: "light" | "dark";
  selectedId?: string | null;
  onSelect?: (playerId: string) => void;
};

export default function BattleProgressStrip({ players, style, tone = "light", selectedId, onSelect }: Props) {
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
          <BattleOpponentChip
            player={item}
            tone={tone}
            active={selectedId === item.id}
            onPress={onSelect ? () => onSelect(item.id) : undefined}
          />
        )}
      />
    </View>
  );
}
