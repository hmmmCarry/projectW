import { useTheme } from "@/providers/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  title?: string;
  greetingName?: string; // shows "Hello there, {name}" when provided and on a root screen
  showBack?: boolean;
  roomId?: string;
  timer?: string;
};

const NavHeader = ({ title, greetingName, showBack, roomId, timer }: Props) => {
  const router = useRouter();
  const segments = useSegments();
  const theme = useTheme();

  const canGoBack = showBack ?? segments.length > 0;

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: theme.colors.background,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {canGoBack ? (
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,
              }}
            >
              <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
            </Pressable>
          ) : null}

          {title ? (
            <Text style={{ color: theme.colors.text, fontWeight: "700", fontSize: 18 }}>{title}</Text>
          ) : greetingName ? (
            <Text style={{ color: theme.colors.text, fontWeight: "700", fontSize: 18 }}>Hello there, {greetingName}</Text>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {timer ? (
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginBottom: 2 }}>Time</Text>
              <Text style={{ color: theme.colors.text, fontWeight: "700" }}>{timer}</Text>
            </View>
          ) : null}
          {roomId ? (
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 10, marginBottom: 2 }}>Room</Text>
              <Text style={{ color: theme.colors.text, fontWeight: "700", letterSpacing: 2 }}>{roomId}</Text>
            </View>
          ) : null}
          {/**
          <Pressable
            accessibilityLabel="Profile"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 8,
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Ionicons name="person-outline" size={18} color={theme.colors.text} />
          </Pressable>
          <ThemeToggle />
          */}
        </View>
      </View>
    </View>
  );
};

export default NavHeader;
