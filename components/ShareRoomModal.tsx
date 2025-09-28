import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useRef } from "react";
import {
    Alert,
    Animated,
    Easing,
    Modal,
    Platform,
    Pressable,
    Share,
    Text,
    View,
} from "react-native";

// Optional: install for real QR rendering (fallback included below)
//   npm i react-native-qrcode-svg
let QRCode: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  QRCode = require("react-native-qrcode-svg").default;
} catch {}

type Props = {
  visible: boolean;
  onClose: () => void;

  roomId: string;               // e.g. "QHBSAK"
  shareText?: string;           // custom message for Share sheet
  deepLink?: string;            // e.g. "projectw://join/QHBSAK" (optional)
};

export default function ShareRoomModal({
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
  }, [visible]);

  const copyCode = async () => {
    await Clipboard.setStringAsync(roomId);
    Alert.alert("Copied", "Room code copied to clipboard.");
  };

  const shareCode = async () => {
    const message = `${shareText} ${roomId}${deepLink ? `\n${deepLink}` : ""}`;
    try {
      await Share.share({ message });
    } catch {}
  };

  const mono = Platform.select({ ios: "Menlo", android: "monospace" });

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      {/* Overlay */}
      <Animated.View
        className="flex-1 bg-black/50 items-center justify-center px-6"
        style={{ opacity: fade }}
      >
        {/* Card */}
        <Animated.View
          className="w-full max-w-sm rounded-2xl bg-white border border-black/10 p-5"
          style={{
            transform: [{ scale }],
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          {/* Close */}
          <Pressable
            onPress={onClose}
            className="absolute right-3 top-3 w-8 h-8 rounded-full items-center justify-center bg-black/5"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={18} color="#222" />
          </Pressable>

          {/* Intro copy */}
          <Text className="text-[13px] text-neutral-600 mb-4">
            The ultimate competitive Wordle experience. Battle friends in duels
            or compete in battle royale mode.
          </Text>

          {/* ROOM ID pill */}
          <View className="flex-row items-center">
            <Pressable
              onPress={copyCode}
              className="flex-1 bg-white border border-neutral-300 rounded-2xl px-4 py-3"
              style={{ shadowColor: "transparent" }}
              testID="pill-copy-room"
            >
              <Text className="text-[11px] text-neutral-500 font-semibold">
                ROOM ID
              </Text>
              <Text
                className="text-lg text-neutral-900 tracking-[1px]"
                style={{ fontFamily: mono }}
              >
                {roomId}
              </Text>
            </Pressable>

            <Pressable
              onPress={shareCode}
              className="ml-2 w-12 h-12 rounded-2xl border border-neutral-300 items-center justify-center"
              accessibilityLabel="Share room"
              testID="pill-share-room"
            >
              <Ionicons name="share-outline" size={20} color="#222" />
            </Pressable>
          </View>

          {/* QR area */}
          <View className="mt-5 items-center justify-center">
            {QRCode ? (
              <View className="rounded-xl overflow-hidden border border-neutral-200 p-8 bg-[#f6f6fe]">
                <QRCode
                  value={deepLink || roomId}
                  size={160}
                  backgroundColor="#f6f6fe"
                  color="#111827"
                />
              </View>
            ) : (
              <View className="w-[220px] h-[160px] rounded-xl bg-neutral-200 items-center justify-center">
                <Text className="text-neutral-600 font-semibold">QR CODE</Text>
                <Text className="text-neutral-500 text-xs mt-1">
                  (Install react-native-qrcode-svg)
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
