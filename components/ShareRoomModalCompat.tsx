import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Modal, Pressable, Share, Text, View } from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  roomId: string;
  deepLink?: string;
  shareText?: string;
};

export default function ShareRoomModalCompat({
  visible,
  onClose,
  roomId,
  deepLink,
  shareText = "Join my Project W room:",
}: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 16,
          stiffness: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fade.setValue(0);
      scale.setValue(0.95);
    }
  }, [visible, fade, scale]);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(roomId);
    } catch {}
  };

  const handleShare = async () => {
    const message = `${shareText} ${roomId}${deepLink ? `\n${deepLink}` : ""}`;
    try {
      await Share.share({ message });
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent>
      <Animated.View
        className="flex-1 bg-black/50 items-center justify-center px-6"
        style={{ opacity: fade }}
      >
        <Animated.View
          className="w-full max-w-sm rounded-2xl bg-white border border-black/10 p-6"
          style={{
            transform: [{ scale }],
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <Pressable
            accessibilityLabel="Close"
            onPress={onClose}
            className="absolute right-3 top-3 w-8 h-8 rounded-full items-center justify-center bg-black/5"
          >
            <Ionicons name="close" size={18} color="#222" />
          </Pressable>

          <View className="items-center mb-3">
            <Ionicons name="share-social-outline" size={20} color="#111827" />
            <Text className="text-base font-semibold mt-2 text-neutral-900">Share your room</Text>
            <Text className="text-xs text-neutral-500 mt-1 text-center">Invite a friend to join your duel.</Text>
          </View>

          <View className="mt-3 flex-row items-center">
            <View
              className="flex-1 bg-white border border-neutral-300 rounded-2xl px-4 py-3"
              style={{ shadowColor: "transparent" }}
            >
              <Text className="text-[11px] text-neutral-500 font-semibold">ROOM ID</Text>
              <Text className="text-lg text-neutral-900 tracking-[1px]">{roomId}</Text>
            </View>
            <Pressable
              onPress={handleCopy}
              className="ml-2 w-12 h-12 rounded-2xl border border-neutral-300 items-center justify-center"
              accessibilityLabel="Copy room"
            >
              <Ionicons name="copy-outline" size={18} color="#222" />
            </Pressable>
          </View>

          <Pressable
            onPress={handleShare}
            className="mt-3 h-12 rounded-xl bg-neutral-900 items-center justify-center"
          >
            <Text className="text-white font-semibold">Share invite</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}


