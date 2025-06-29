import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AvatarOption } from "./AvatarSelectionModal";

interface UserAvatarProps {
  userId: string;
  size?: number;
  showName?: boolean;
  fallbackText?: string;
  style?: any;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  size = 40,
  showName = false,
  fallbackText = "👤",
  style,
}) => {
  const [avatar, setAvatar] = useState<AvatarOption | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserAvatar();
  }, [userId]);

  const loadUserAvatar = async () => {
    try {
      const savedAvatar = await AsyncStorage.getItem(`user_avatar_${userId}`);
      if (savedAvatar) {
        const avatarData = JSON.parse(savedAvatar);
        setAvatar(avatarData);
      }
    } catch (error) {
      console.error("Error loading user avatar:", error);
    } finally {
      setLoading(false);
    }
  };

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: "#f3f4f6",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    ...style,
  };

  const emojiSize = size * 0.6;

  if (loading) {
    return (
      <View style={avatarStyle}>
        <Text style={{ fontSize: emojiSize }}>⏳</Text>
      </View>
    );
  }

  return (
    <View style={[avatarStyle, avatar && { backgroundColor: "#eff6ff" }]}>
      <Text style={{ fontSize: emojiSize }}>
        {avatar ? avatar.emoji : fallbackText}
      </Text>
      {showName && avatar && (
        <Text style={[styles.avatarName, { fontSize: size * 0.2 }]}>
          {avatar.category}
        </Text>
      )}
    </View>
  );
};

// Hook for getting user avatar data
export const useUserAvatar = (userId: string) => {
  const [avatar, setAvatar] = useState<AvatarOption | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserAvatar();
  }, [userId]);

  const loadUserAvatar = async () => {
    try {
      const savedAvatar = await AsyncStorage.getItem(`user_avatar_${userId}`);
      if (savedAvatar) {
        const avatarData = JSON.parse(savedAvatar);
        setAvatar(avatarData);
      }
    } catch (error) {
      console.error("Error loading user avatar:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAvatar = () => {
    setLoading(true);
    loadUserAvatar();
  };

  return { avatar, loading, refreshAvatar };
};

const styles = StyleSheet.create({
  avatarName: {
    color: "#6b7280",
    fontWeight: "500",
    marginTop: 2,
  },
});
