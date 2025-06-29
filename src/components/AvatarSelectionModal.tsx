import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

interface AvatarSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAvatar: (avatar: AvatarOption) => void;
  currentAvatar?: string;
  userId: string;
}

export interface AvatarOption {
  id: string;
  emoji: string;
  name: string;
  category: "male" | "female" | "non-binary";
  ethnicity: "light" | "medium-light" | "medium" | "medium-dark" | "dark";
}

const AVATAR_OPTIONS: AvatarOption[] = [
  // Male Light Skin
  {
    id: "male-light-1",
    emoji: "👨🏻",
    name: "Man (Light)",
    category: "male",
    ethnicity: "light",
  },
  {
    id: "male-light-2",
    emoji: "👨🏻‍💼",
    name: "Man Professional (Light)",
    category: "male",
    ethnicity: "light",
  },
  {
    id: "male-light-3",
    emoji: "👨🏻‍🔧",
    name: "Man Mechanic (Light)",
    category: "male",
    ethnicity: "light",
  },

  // Male Medium Light Skin
  {
    id: "male-medium-light-1",
    emoji: "👨🏼",
    name: "Man (Medium Light)",
    category: "male",
    ethnicity: "medium-light",
  },
  {
    id: "male-medium-light-2",
    emoji: "👨🏼‍💼",
    name: "Man Professional (Medium Light)",
    category: "male",
    ethnicity: "medium-light",
  },
  {
    id: "male-medium-light-3",
    emoji: "👨🏼‍🔧",
    name: "Man Mechanic (Medium Light)",
    category: "male",
    ethnicity: "medium-light",
  },

  // Male Medium Skin
  {
    id: "male-medium-1",
    emoji: "👨🏽",
    name: "Man (Medium)",
    category: "male",
    ethnicity: "medium",
  },
  {
    id: "male-medium-2",
    emoji: "👨🏽‍💼",
    name: "Man Professional (Medium)",
    category: "male",
    ethnicity: "medium",
  },
  {
    id: "male-medium-3",
    emoji: "👨🏽‍🔧",
    name: "Man Mechanic (Medium)",
    category: "male",
    ethnicity: "medium",
  },

  // Male Medium Dark Skin
  {
    id: "male-medium-dark-1",
    emoji: "👨🏾",
    name: "Man (Medium Dark)",
    category: "male",
    ethnicity: "medium-dark",
  },
  {
    id: "male-medium-dark-2",
    emoji: "👨🏾‍💼",
    name: "Man Professional (Medium Dark)",
    category: "male",
    ethnicity: "medium-dark",
  },
  {
    id: "male-medium-dark-3",
    emoji: "👨🏾‍🔧",
    name: "Man Mechanic (Medium Dark)",
    category: "male",
    ethnicity: "medium-dark",
  },

  // Male Dark Skin
  {
    id: "male-dark-1",
    emoji: "👨🏿",
    name: "Man (Dark)",
    category: "male",
    ethnicity: "dark",
  },
  {
    id: "male-dark-2",
    emoji: "👨🏿‍💼",
    name: "Man Professional (Dark)",
    category: "male",
    ethnicity: "dark",
  },
  {
    id: "male-dark-3",
    emoji: "👨🏿‍🔧",
    name: "Man Mechanic (Dark)",
    category: "male",
    ethnicity: "dark",
  },

  // Female Light Skin
  {
    id: "female-light-1",
    emoji: "👩🏻",
    name: "Woman (Light)",
    category: "female",
    ethnicity: "light",
  },
  {
    id: "female-light-2",
    emoji: "👩🏻‍💼",
    name: "Woman Professional (Light)",
    category: "female",
    ethnicity: "light",
  },
  {
    id: "female-light-3",
    emoji: "👩🏻‍🔧",
    name: "Woman Mechanic (Light)",
    category: "female",
    ethnicity: "light",
  },

  // Female Medium Light Skin
  {
    id: "female-medium-light-1",
    emoji: "👩🏼",
    name: "Woman (Medium Light)",
    category: "female",
    ethnicity: "medium-light",
  },
  {
    id: "female-medium-light-2",
    emoji: "👩🏼‍💼",
    name: "Woman Professional (Medium Light)",
    category: "female",
    ethnicity: "medium-light",
  },
  {
    id: "female-medium-light-3",
    emoji: "👩🏼‍🔧",
    name: "Woman Mechanic (Medium Light)",
    category: "female",
    ethnicity: "medium-light",
  },

  // Female Medium Skin
  {
    id: "female-medium-1",
    emoji: "👩🏽",
    name: "Woman (Medium)",
    category: "female",
    ethnicity: "medium",
  },
  {
    id: "female-medium-2",
    emoji: "👩🏽‍💼",
    name: "Woman Professional (Medium)",
    category: "female",
    ethnicity: "medium",
  },
  {
    id: "female-medium-3",
    emoji: "👩🏽‍🔧",
    name: "Woman Mechanic (Medium)",
    category: "female",
    ethnicity: "medium",
  },

  // Female Medium Dark Skin
  {
    id: "female-medium-dark-1",
    emoji: "👩🏾",
    name: "Woman (Medium Dark)",
    category: "female",
    ethnicity: "medium-dark",
  },
  {
    id: "female-medium-dark-2",
    emoji: "👩🏾‍💼",
    name: "Woman Professional (Medium Dark)",
    category: "female",
    ethnicity: "medium-dark",
  },
  {
    id: "female-medium-dark-3",
    emoji: "👩🏾‍🔧",
    name: "Woman Mechanic (Medium Dark)",
    category: "female",
    ethnicity: "medium-dark",
  },

  // Female Dark Skin
  {
    id: "female-dark-1",
    emoji: "👩🏿",
    name: "Woman (Dark)",
    category: "female",
    ethnicity: "dark",
  },
  {
    id: "female-dark-2",
    emoji: "👩🏿‍💼",
    name: "Woman Professional (Dark)",
    category: "female",
    ethnicity: "dark",
  },
  {
    id: "female-dark-3",
    emoji: "👩🏿‍🔧",
    name: "Woman Mechanic (Dark)",
    category: "female",
    ethnicity: "dark",
  },

  // Non-Binary/Gender-Neutral Options
  {
    id: "non-binary-1",
    emoji: "🧑",
    name: "Person (Default)",
    category: "non-binary",
    ethnicity: "light",
  },
  {
    id: "non-binary-light",
    emoji: "🧑🏻",
    name: "Person (Light)",
    category: "non-binary",
    ethnicity: "light",
  },
  {
    id: "non-binary-medium-light",
    emoji: "🧑🏼",
    name: "Person (Medium Light)",
    category: "non-binary",
    ethnicity: "medium-light",
  },
  {
    id: "non-binary-medium",
    emoji: "🧑🏽",
    name: "Person (Medium)",
    category: "non-binary",
    ethnicity: "medium",
  },
  {
    id: "non-binary-medium-dark",
    emoji: "🧑🏾",
    name: "Person (Medium Dark)",
    category: "non-binary",
    ethnicity: "medium-dark",
  },
  {
    id: "non-binary-dark",
    emoji: "🧑🏿",
    name: "Person (Dark)",
    category: "non-binary",
    ethnicity: "dark",
  },
  {
    id: "non-binary-professional",
    emoji: "🧑‍💼",
    name: "Person Professional",
    category: "non-binary",
    ethnicity: "light",
  },
  {
    id: "non-binary-mechanic",
    emoji: "🧑‍🔧",
    name: "Person Mechanic",
    category: "non-binary",
    ethnicity: "light",
  },
];

export const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  visible,
  onClose,
  onSelectAvatar,
  currentAvatar,
  userId,
}) => {
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(
    currentAvatar || "",
  );
  const [activeFilter, setActiveFilter] = useState<
    "all" | "male" | "female" | "non-binary"
  >("all");
  const [scaleAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (currentAvatar) {
      setSelectedAvatarId(currentAvatar);
    }
  }, [currentAvatar]);

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const filteredAvatars = AVATAR_OPTIONS.filter(
    (avatar) => activeFilter === "all" || avatar.category === activeFilter,
  );

  const handleSaveAvatar = async () => {
    const selectedAvatar = AVATAR_OPTIONS.find(
      (avatar) => avatar.id === selectedAvatarId,
    );
    if (selectedAvatar) {
      try {
        await AsyncStorage.setItem(
          `user_avatar_${userId}`,
          JSON.stringify(selectedAvatar),
        );
        onSelectAvatar(selectedAvatar);
        onClose();
      } catch (error) {
        console.error("Error saving avatar:", error);
      }
    }
  };

  const FilterChip: React.FC<{
    filter: typeof activeFilter;
    label: string;
    icon: string;
    count: number;
  }> = ({ filter, label, icon, count }) => (
    <TouchableOpacity
      onPress={() => setActiveFilter(filter)}
      style={[
        styles.filterChip,
        activeFilter === filter && styles.activeFilterChip,
      ]}
    >
      <LinearGradient
        colors={
          activeFilter === filter
            ? ["#667eea", "#764ba2"]
            : ["transparent", "transparent"]
        }
        style={styles.filterGradient}
      >
        <Ionicons
          name={icon as any}
          size={18}
          color={activeFilter === filter ? "white" : "#6b7280"}
        />
        <Text
          style={[
            styles.filterLabel,
            activeFilter === filter && styles.activeFilterLabel,
          ]}
        >
          {label}
        </Text>
        <View
          style={[
            styles.countBadge,
            activeFilter === filter && styles.activeCountBadge,
          ]}
        >
          <Text
            style={[
              styles.countText,
              activeFilter === filter && styles.activeCountText,
            ]}
          >
            {count}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const AvatarCard: React.FC<{ avatar: AvatarOption; index: number }> = ({
    avatar,
    index,
  }) => {
    const isSelected = selectedAvatarId === avatar.id;

    return (
      <Animated.View
        style={[
          styles.avatarCard,
          isSelected && styles.selectedAvatarCard,
          {
            transform: [
              {
                scale: scaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setSelectedAvatarId(avatar.id)}
          style={styles.avatarButton}
          activeOpacity={0.7}
        >
          {isSelected && (
            <LinearGradient
              colors={["#667eea", "#764ba2"]}
              style={styles.selectionGlow}
            />
          )}

          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
            {isSelected && (
              <View style={styles.checkmarkContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              </View>
            )}
          </View>

          <Text
            style={[styles.avatarName, isSelected && styles.selectedAvatarName]}
          >
            {avatar.name}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const getFilterCount = (filter: typeof activeFilter) => {
    if (filter === "all") return AVATAR_OPTIONS.length;
    return AVATAR_OPTIONS.filter((avatar) => avatar.category === filter).length;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Choose Your Avatar</Text>
              <Text style={styles.headerSubtitle}>
                Pick one that represents you best
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSaveAvatar}
              disabled={!selectedAvatarId}
              style={[
                styles.saveButton,
                !selectedAvatarId && styles.disabledButton,
              ]}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            <FilterChip
              filter="all"
              label="All"
              icon="apps-outline"
              count={getFilterCount("all")}
            />
            <FilterChip
              filter="male"
              label="Male"
              icon="man-outline"
              count={getFilterCount("male")}
            />
            <FilterChip
              filter="female"
              label="Female"
              icon="woman-outline"
              count={getFilterCount("female")}
            />
            <FilterChip
              filter="non-binary"
              label="Non-Binary"
              icon="person-outline"
              count={getFilterCount("non-binary")}
            />
          </ScrollView>
        </View>

        {/* Avatar Grid */}
        <ScrollView
          style={styles.avatarGrid}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gridContainer}>
            {filteredAvatars.map((avatar, index) => (
              <AvatarCard key={avatar.id} avatar={avatar} index={index} />
            ))}
          </View>
          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    minWidth: 80,
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 6,
  },
  filterSection: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 16,
  },
  filterContainer: {
    gap: 12,
    paddingRight: 20,
  },
  filterChip: {
    borderRadius: 25,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  activeFilterChip: {
    borderColor: "transparent",
  },
  filterGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  activeFilterLabel: {
    color: "white",
  },
  countBadge: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  activeCountBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  activeCountText: {
    color: "white",
  },
  avatarGrid: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 20,
    justifyContent: "space-between",
  },
  avatarCard: {
    width: (width - 48) / 3,
    marginBottom: 16,
  },
  selectedAvatarCard: {
    transform: [{ scale: 1.05 }],
  },
  avatarButton: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 20,
  },
  selectionGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  avatarContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
  },
  avatarEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  checkmarkContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarName: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    fontWeight: "500",
    marginTop: 8,
    lineHeight: 14,
  },
  selectedAvatarName: {
    color: "#667eea",
    fontWeight: "600",
  },
  bottomPadding: {
    height: 40,
  },
});
