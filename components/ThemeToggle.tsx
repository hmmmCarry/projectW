import { useTheme } from "@/providers/ThemeProvider";
import { Feather } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const translateX = useSharedValue(isDark ? 46 : 3.5);

  const Icon = (props: any) => {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    return (
      <View className="w-10 h-10 items-center z-50 relative justify-center rounded-full flex flex-row">
        <Feather
          name={props.icon}
          size={20}
          color={isDark ? "white" : "black"}
        />
      </View>
    );
  };

  useEffect(() => {
    translateX.value = withSpring(isDark ? 46 : 3.5, {
      damping: 15,
      stiffness: 150,
    });
  }, [isDark]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });
  return (
    <Pressable
      onPress={toggleTheme}
      className="w-24 h-12 p-1 bg-secondary rounded-full flex-row items-center justify-between"
    >
      <Icon icon="sun" />
      <Icon icon="moon" />
      <Animated.View
        style={[animatedStyle]}
        className="w-8 h-8 bg-white rounded-full absolute top-2.5 left-1 shadow-lg"
      />
    </Pressable>
  );
};
