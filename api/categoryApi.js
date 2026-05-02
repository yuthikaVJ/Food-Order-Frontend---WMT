import apiClient from "./client";

export const getCategories = async () => {
  const response = await apiClient.get("/categories");
  return response.data;
};

export const createCategory = async (payload) => {
  const formData = new FormData();

  formData.append("name", payload.name);
  formData.append("description", payload.description || "");
  formData.append("isActive", String(payload.isActive));

  if (payload.categoryImage) {
    formData.append("categoryImage", {
      uri: payload.categoryImage.uri,
      name: payload.categoryImage.name,
      type: payload.categoryImage.type,
    });
  }

  const response = await apiClient.post("/categories", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const updateCategory = async (id, payload) => {
  const formData = new FormData();

  formData.append("name", payload.name);
  formData.append("description", payload.description || "");
  formData.append("isActive", String(payload.isActive));

  if (payload.categoryImage) {
    formData.append("categoryImage", {
      uri: payload.categoryImage.uri,
      name: payload.categoryImage.name,
      type: payload.categoryImage.type,
    });
  }

  const response = await apiClient.put(`/categories/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await apiClient.delete(`/categories/${id}`);
  return response.data;
};