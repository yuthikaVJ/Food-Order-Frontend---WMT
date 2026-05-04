import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";

import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../../api/categoryApi";

import AnimatedEntrance from "../../components/AnimatedEntrance";
import EmptyState from "../../components/EmptyState";
import FormInput from "../../components/FormInput";
import PrimaryButton from "../../components/PrimaryButton";
import ScreenContainer from "../../components/ScreenContainer";
import SectionTitle from "../../components/SectionTitle";
import StatusBadge from "../../components/StatusBadge";
import { COLORS, FONTS, SHADOWS } from "../../utils/constants";
import { countLetters, extractErrorMessage } from "../../utils/helpers";

const CATEGORY_NAME_LETTER_LIMIT = 25;
const CATEGORY_DESCRIPTION_LETTER_LIMIT = 100;

const initialForm = {
  name: "",
  description: "",
  categoryImage: null,
  previewImage: "",
  isActive: true,
};

export default function ManageCategoriesScreen() {
  const isFocused = useIsFocused();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isFocused) {
      loadCategories();
    }
  }, [isFocused]);

  // ========== READ: Fetch all categories ==========
  const loadCategories = async () => {
    try {
      setError("");
      const data = await getCategories();
      setCategories(data.categories || []);
    } catch (error) {
      setError(extractErrorMessage(error, "Failed to load categories"));
    }
  };

  const metrics = useMemo(() => {
    const active = categories.filter((category) => category.isActive).length;

    return {
      active,
      inactive: categories.length - active,
    };
  }, [categories]);

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const getLetterCount = (value) => countLetters(value);

  // ========== VALIDATION: Calculate letter counts for input limits ==========
  const nameLetterCount = getLetterCount(form.name);
  const descriptionLetterCount = getLetterCount(form.description);
  const isNameOverLimit = nameLetterCount > CATEGORY_NAME_LETTER_LIMIT;
  const isDescriptionOverLimit =
    descriptionLetterCount > CATEGORY_DESCRIPTION_LETTER_LIMIT;

  const resetForm = () => {
    setForm(initialForm);
    setEditingId("");
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow gallery permission to choose an image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    const fileName = asset.uri.split("/").pop() || "category-image.jpg";

    let fileType = asset.mimeType || "image/jpeg";

    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(fileType)) {
      fileType = "image/jpeg";
    }

    setForm((current) => ({
      ...current,
      categoryImage: {
        uri: asset.uri,
        name: fileName,
        type: fileType,
      },
      previewImage: asset.uri,
    }));
  };

  // ========== VALIDATION: Check form inputs ==========
  const validateForm = () => {
    // Name required check
    if (!form.name.trim()) {
      Alert.alert("Validation Error", "Category name is required");
      return false;
    }

    // Name min length check
    if (form.name.trim().length < 2) {
      Alert.alert(
        "Validation Error",
        "Category name must have at least 2 characters"
      );
      return false;
    }

    // Name letter limit check (max 25 letters)
    if (isNameOverLimit) {
      Alert.alert(
        "Validation Error",
        `Category name must be ${CATEGORY_NAME_LETTER_LIMIT} letters or fewer`
      );
      return false;
    }

    // Description letter limit check (max 100 letters)
    if (isDescriptionOverLimit) {
      Alert.alert(
        "Validation Error",
        `Description must be ${CATEGORY_DESCRIPTION_LETTER_LIMIT} letters or fewer`
      );
      return false;
    }

    return true;
  };

  // ========== CREATE/UPDATE: Save category ==========
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        isActive: form.isActive,
        categoryImage: form.categoryImage,
      };

      // UPDATE if editing, else CREATE new
      if (editingId) {
        await updateCategory(editingId, payload);
        Alert.alert("Updated", "Category updated successfully");
      } else {
        await createCategory(payload);
        Alert.alert("Created", "Category created successfully");
      }

      resetForm();
      await loadCategories();
    } catch (error) {
      Alert.alert(
        "Category Error",
        extractErrorMessage(error, "Failed to save category")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category._id);

    setForm({
      name: category.name,
      description: category.description || "",
      categoryImage: null,
      previewImage: category.categoryImage || "",
      isActive: category.isActive,
    });
  };

  const confirmDelete = (id) => {
    Alert.alert(
      "Delete Category",
      "Are you sure you want to delete this category?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(id),
        },
      ]
    );
  };

  // ========== DELETE: Remove category ==========
  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      await loadCategories();
      Alert.alert("Deleted", "Category deleted successfully");
    } catch (error) {
      Alert.alert(
        "Delete Error",
        extractErrorMessage(error, "Failed to delete category")
      );
    }
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <AnimatedEntrance trigger={isFocused}>
        <SectionTitle
          eyebrow="Admin"
          title="Category Management"
          subtitle="Create and maintain the food categories used across the menu."
        />
      </AnimatedEntrance>

      <AnimatedEntrance delay={60} trigger={isFocused} style={styles.heroCard}>
        <LinearGradient
          colors={["#1B1720", "#5A485F", "#9E877A"]}
          style={styles.heroGradient}
        >
          <Text style={styles.heroEyebrow}>Taxonomy Control</Text>

          <Text style={styles.heroTitle}>
            Keep the menu organized before dishes go live.
          </Text>

          <View style={styles.heroMetrics}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>{categories.length}</Text>
              <Text style={styles.heroMetricLabel}>All Categories</Text>
            </View>

            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>{metrics.active}</Text>
              <Text style={styles.heroMetricLabel}>Active</Text>
            </View>

            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>{metrics.inactive}</Text>
              <Text style={styles.heroMetricLabel}>Inactive</Text>
            </View>
          </View>
        </LinearGradient>
      </AnimatedEntrance>

      <AnimatedEntrance delay={110} trigger={isFocused} style={styles.formCard}>
        <View style={styles.formHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.formEyebrow}>
              {editingId ? "Editing Category" : "Create Category"}
            </Text>

            <Text style={styles.formTitle}>
              {editingId ? "Update category details" : "Add a new food group"}
            </Text>
          </View>

          <StatusBadge
            label={form.isActive ? "Active" : "Inactive"}
            color={form.isActive ? COLORS.success : COLORS.warning}
          />
        </View>

        <Text style={styles.autoNumberNote}>
          Category Number: Auto generated by system
        </Text>

        <FormInput
          label="Category Name"
          value={form.name}
          onChangeText={(value) => updateField("name", value)}
          placeholder="Burgers"
          maxLength={CATEGORY_NAME_LETTER_LIMIT}
        />

        <View style={styles.wordCountRow}>
          <Text style={styles.wordCountLabel}>Letter count</Text>
          <Text
            style={[
              styles.wordCountValue,
              isNameOverLimit && styles.wordCountValueError,
            ]}
          >
            {nameLetterCount}/{CATEGORY_NAME_LETTER_LIMIT}
          </Text>
        </View>

        {isNameOverLimit ? (
          <Text style={styles.errorText}>
            Category name cannot exceed {CATEGORY_NAME_LETTER_LIMIT} letters.
          </Text>
        ) : null}

        <FormInput
          label="Description"
          value={form.description}
          onChangeText={(value) => updateField("description", value)}
          placeholder="All burger items"
          multiline
          maxLength={CATEGORY_DESCRIPTION_LETTER_LIMIT}
        />

        <View style={styles.wordCountRow}>
          <Text style={styles.wordCountLabel}>Letter count</Text>
          <Text
            style={[
              styles.wordCountValue,
              isDescriptionOverLimit && styles.wordCountValueError,
            ]}
          >
            {descriptionLetterCount}/{CATEGORY_DESCRIPTION_LETTER_LIMIT}
          </Text>
        </View>

        {isDescriptionOverLimit ? (
          <Text style={styles.errorText}>
            Description cannot exceed {CATEGORY_DESCRIPTION_LETTER_LIMIT} letters.
          </Text>
        ) : null}
        <Text style={styles.imageLabel}>Category Image</Text>

        {form.previewImage ? (
          <Image source={{ uri: form.previewImage }} style={styles.previewImage} />
        ) : (
          <View style={styles.noImageBox}>
            <Text style={styles.noImageText}>No image selected</Text>
          </View>
        )}

        <PrimaryButton
          title={form.previewImage ? "Change Image" : "Choose Image"}
          variant="outline"
          onPress={pickImage}
        />

        <Pressable
          style={[styles.toggleButton, form.isActive && styles.toggleButtonActive]}
          onPress={() => updateField("isActive", !form.isActive)}
        >
          <Text
            style={[
              styles.toggleText,
              form.isActive && styles.toggleTextActive,
            ]}
          >
            {form.isActive ? "Category is Active" : "Category is Inactive"}
          </Text>
        </Pressable>

        <PrimaryButton
          title={editingId ? "Update Category" : "Create Category"}
          onPress={handleSubmit}
          loading={saving}
        />

        {editingId ? (
          <PrimaryButton
            title="Cancel Edit"
            variant="outline"
            onPress={resetForm}
          />
        ) : null}
      </AnimatedEntrance>

      {error ? (
        <AnimatedEntrance delay={150} trigger={isFocused}>
          <EmptyState title="Cannot load categories" description={error} />
        </AnimatedEntrance>
      ) : categories.length ? (
        // ========== DISPLAY: Show all categories ==========
        categories.map((category, index) => (
          <AnimatedEntrance
            key={category._id}
            delay={160 + index * 35}
            trigger={isFocused}
            style={styles.categoryCard}
          >
            {category.categoryImage ? (
              <Image
                source={{ uri: category.categoryImage }}
                style={styles.categoryImage}
              />
            ) : (
              <View style={styles.noImageBox}>
                <Text style={styles.noImageText}>No Image</Text>
              </View>
            )}

            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.categoryNumber}>
                  {category.categoryNumber}
                </Text>

                <Text style={styles.categoryName}>{category.name}</Text>
              </View>

              <StatusBadge
                label={category.isActive ? "Active" : "Inactive"}
                color={category.isActive ? COLORS.success : COLORS.warning}
              />
            </View>

            <Text style={styles.categoryDescription}>
              {category.description || "No description added."}
            </Text>

            <View style={styles.actionRow}>
              <PrimaryButton
                title="Edit"
                variant="outline"
                style={styles.smallButton}
                onPress={() => handleEdit(category)}
              />

              <PrimaryButton
                title="Delete"
                variant="ghost"
                style={styles.smallButton}
                onPress={() => confirmDelete(category._id)}
              />
            </View>
          </AnimatedEntrance>
        ))
      ) : (
        <AnimatedEntrance delay={150} trigger={isFocused}>
          <EmptyState
            title="No categories yet"
            description="Create your first category using the form above."
          />
        </AnimatedEntrance>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 132,
  },

  heroCard: {
    borderRadius: 30,
    overflow: "hidden",
    ...SHADOWS.strong,
  },

  heroGradient: {
    paddingHorizontal: 20,
    paddingVertical: 22,
  },

  heroEyebrow: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: "rgba(255,255,255,0.74)",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },

  heroTitle: {
    fontFamily: FONTS.display,
    fontSize: 28,
    lineHeight: 36,
    color: COLORS.white,
    marginTop: 8,
  },

  heroMetrics: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },

  heroMetric: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  heroMetricValue: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.white,
  },

  heroMetricLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
    marginTop: 6,
  },

  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    marginTop: 16,
    ...SHADOWS.medium,
  },

  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 2,
  },

  formEyebrow: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  formTitle: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: COLORS.text,
    marginTop: 4,
  },

  autoNumberNote: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textMuted,
    backgroundColor: COLORS.surfaceAlt,
    padding: 12,
    borderRadius: 14,
    marginTop: 14,
    marginBottom: 8,
  },

  helperText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
  },

  wordCountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },

  wordCountLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.textMuted,
  },

  wordCountValue: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.text,
  },

  wordCountValueError: {
    color: COLORS.danger,
  },

  errorText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 6,
  },

  imageLabel: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.text,
    marginTop: 14,
    marginBottom: 8,
  },

  previewImage: {
    width: "100%",
    height: 170,
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: COLORS.surfaceAlt,
  },

  categoryImage: {
    width: "100%",
    height: 160,
    borderRadius: 20,
    marginBottom: 14,
    backgroundColor: COLORS.surfaceAlt,
  },

  noImageBox: {
    width: "100%",
    height: 140,
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: COLORS.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },

  noImageText: {
    fontFamily: FONTS.semiBold,
    color: COLORS.textMuted,
  },

  toggleButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: COLORS.surfaceAlt,
  },

  toggleButtonActive: {
    backgroundColor: COLORS.secondary,
  },

  toggleText: {
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },

  toggleTextActive: {
    color: COLORS.white,
  },

  categoryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginTop: 14,
    ...SHADOWS.soft,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  categoryNumber: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 4,
  },

  categoryName: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.text,
  },

  categoryDescription: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 10,
    lineHeight: 21,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  smallButton: {
    flex: 1,
  },
});