// import { getSocket } from "@/lib/socket";
// import { useTheme } from "@/providers/ThemeProvider";
// import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import { JSX, useMemo } from "react";
// import { Pressable, ScrollView, Text, View } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import "../globals.css";

// function Section({ title, icon, children }: { title: string; icon?: JSX.Element; children: React.ReactNode }) {
//   const theme = useTheme();
//   const { colors } = theme;
  
//   return (
//     <View className="mt-6">
//       <View className="flex-row items-center px-4 mb-2">
//         {icon}  
//         <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold", marginLeft: 8 }}>
//           {title}
//         </Text>
//       </View>
//       {children}
//     </View>
//   );
// }

// function GameCard({ onPress, label }: { onPress?: () => void; label?: string }) {
//   const theme = useTheme();
//   const { colors } = theme;
  
//   return (
//     <Pressable onPress={onPress}>
//       {({ pressed }) => (
//         <View
//           style={{
//             height: 128,
//             width: 208,
//             borderRadius: 16,
//             backgroundColor: colors.card,
//             borderWidth: 1,
//             borderColor: colors.border,
//             justifyContent: "center",
//             alignItems: "center",
//             marginRight: 12,
//             transform: [{ scale: pressed ? 0.96 : 1 }],
//             opacity: pressed ? 0.8 : 1,
//           }}
//         >
//           {label ? (
//             <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 18 }}>
//               {label}
//             </Text>
//           ) : null}
//         </View>
//       )}
//     </Pressable>
//   );
// }

// export default function Index() {
//   const router = useRouter();
//   const socket = useMemo(() => getSocket(), []);
//   const theme = useTheme();
//   const { colors } = theme;

//   const handleQuickDuel = () => {
//     const name = "Player";
//     if (!socket.connected) socket.connect();
//     socket.emit("createRoom", { name, mode: "duel" }, (res?: { roomId?: string; error?: string }) => {
//       if (res?.roomId) {
//         router.push({
//           pathname: "/duel-game-start",
//           params: { roomId: res.roomId, name, host: "1" },
//         });
//       } else {
//         console.warn(res?.error || "Could not create room.");
//       }
//     });
//   };

//   return (
//     <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
//       <ScrollView showsVerticalScrollIndicator={false}>
//         {/* Header */}
//         <View className="flex flex-row items-center justify-between px-4 mt-4">
//           <View>
//             <Text style={{ color: colors.textMuted, fontSize: 18 }}>Hello there!</Text>
//             <Text style={{ color: colors.text, fontSize: 32, fontWeight: "bold" }}>Username</Text>
//           </View>
//           <View className="flex-row gap-3 items-center">
//             <Ionicons name="person-circle-outline" size={28} color={colors.text} />
//             <Feather name="sun" size={24} color={colors.text} />
//           </View>
//         </View>

//         {/* Duel Section */}
//         <Section
//           title="Duel (1x1)"
//           icon={<MaterialCommunityIcons name="sword-cross" size={24} color={colors.text} />}
//         >
//           <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4">
//             <GameCard onPress={() => router.push("/duel")} label="Create Duel" />
//             <GameCard onPress={handleQuickDuel} label="Quick Duel" />
//           </ScrollView>
//         </Section>

//         {/* Battle Royale Section */}
//         <Section
//           title="Battle Royale"
//           icon={<MaterialCommunityIcons name="crown" size={24} color={colors.text} />}
//         >
//           <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4">
//             <GameCard onPress={() => router.push("/battle-royale-lobby")} label="Join Match" />
//             <GameCard label="Private Room" />
//           </ScrollView>
//         </Section>

//         {/* How to play */}
//         <Section title="How to play" icon={<MaterialCommunityIcons name="book-open" size={24} color={colors.text} />}>
//           <View className="px-4">
//             <GameCard label="Tutorial" />
//           </View>
//         </Section>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }


// Replace lines 27-58 with this beautiful gradient GameCard

// Replace lines 85-94 with this enhanced header


import { getSocket } from "@/lib/socket";
import { useTheme } from "@/providers/ThemeProvider";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { JSX, useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../globals.css";

function Section({ title, icon, children }: { title: string; icon?: JSX.Element; children: React.ReactNode }) {
  const theme = useTheme();
  const { colors } = theme;
  
  return (
    <View className="mt-6">
      <View className="flex-row items-center px-4 mb-2">
        {icon}  
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold", marginLeft: 8 }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function GameCard({ onPress, label }: { onPress?: () => void; label?: string }) {
  const theme = useTheme();
  const { colors } = theme;
  
  // Different gradients for different game types
  const getGradient = (label: string) => {
    switch(label) {
      case "Create Duel":
      case "Quick Duel":
        return ['#FF6B6B', '#FF8E8E']; // Red duel gradient
      case "Join Match":
        return ['#4ECDC4', '#6CE5DC']; // Teal battle gradient  
      case "Private Room":
        return ['#45B7D1', '#7BCDE8']; // Blue royal gradient
      case "Tutorial":
        return ['#6C5CE7', '#A29BFE']; // Purple learn gradient
      default:
        return ['#95A5A6', '#BDC3C7']; // Gray default
    }
  };
  
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <LinearGradient
          colors={getGradient(label || "")}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 128,
            width: 208,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
            transform: [{ scale: pressed ? 0.96 : 1 }],
            opacity: pressed ? 0.8 : 1,
            shadowColor: getGradient(label || "")[0],
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 15,
            elevation: 8,
          }}
        >
          {label ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ 
                color: 'white', 
                fontWeight: "bold", 
                fontSize: 16,
                textAlign: 'center'
              }}>
                {label}
              </Text>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
                marginTop: 6,
              }}>
                <Text style={{ 
                  color: 'white', 
                  fontSize: 11,
                  opacity: 0.9
                }}>
                  Tap to play →
                </Text>
              </View>
            </View>
          ) : null}
        </LinearGradient>
      )}
    </Pressable>
  );
}

export default function Index() {
  const router = useRouter();
  const socket = useMemo(() => getSocket(), []);
  const theme = useTheme();
  const { colors } = theme;

  const handleQuickDuel = () => {
    const name = "Player";
    if (!socket.connected) socket.connect();
    socket.emit("createRoom", { name, mode: "duel" }, (res?: { roomId?: string; error?: string }) => {
      if (res?.roomId) {
        router.push({
          pathname: "/duel-game-start",
          params: { roomId: res.roomId, name, host: "1" },
        });
      } else {
        console.warn(res?.error || "Could not create room.");
      }
    });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Beautiful Header */}
        <View className="flex flex-row items-center justify-between px-6 mt-6 mb-4">
          <View style={{ gap: 4 }}>
            <Text style={{ color: colors.textMuted, fontSize: 16, fontWeight: "500" }}>
              🌟 Hello there!
            </Text>
            <Text style={{ color: colors.text, fontSize: 28, fontWeight: "bold" }}>
              Word Master
            </Text>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 2,
            }}>
              <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600" }}>
                Rank #42 ↗️ Rising!
              </Text>
            </View>
          </View>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.success,
                marginRight: 4,
              }} />
              <Text style={{ color: colors.success, fontSize: 11, fontWeight: "600" }}>
                Online
              </Text>
            </View>
          </View>
        </View>

        {/* Duel Section */}
        <Section
          title="⚡ Quick Play"
          // icon={<MaterialCommunityIcons name="sword-cross" size={24} color={colors.text} />}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4">
            <GameCard onPress={() => router.push("/duel")} label="Create Duel" />
            <GameCard onPress={handleQuickDuel} label="Quick Duel" />
          </ScrollView>
        </Section>

        {/* Battle Royale Section */}
        <Section
          title="👑 Battle Royale"
          // icon={<MaterialCommunityIcons name="crown" size={24} color={colors.text} />}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pl-4">
            <GameCard onPress={() => router.push("/battle-royale-lobby")} label="Join Match" />
            <GameCard label="Private Room" />
          </ScrollView>
        </Section>

        {/* How to play */}
        <Section title="📚 Learn" 
        // icon={<MaterialCommunityIcons name="book-open" size={24} color={colors.text} />}
        >
          <View className="px-4">
            <GameCard label="Tutorial" />
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
