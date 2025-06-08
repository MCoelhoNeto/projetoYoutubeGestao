/* eslint-disable @typescript-eslint/no-explicit-any */
// /lib/services/categoryService.ts
export interface Category {
  _id?: string;
  name: string;
  description?: string;
  color?: string;
  channelsCount?: number;
  createdAt?: string;
}

const BASE_URL = "/api/categories";

export const CategoryService = {
  async list(): Promise<Category[]> {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error("Erro ao buscar categorias");
    const json = await res.json();
    return json.categories;
  },

  async get(id: string): Promise<Category> {
    const res = await fetch(`${BASE_URL}/${id}`);
    if (!res.ok) throw new Error("Erro ao buscar categoria");
    const json = await res.json();
    return json.category;
  },

  create: async (data: any) => {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      // Usa mensagem da API se existir
      const message = result?.error || "Erro ao criar categoria";
      throw new Error(message);
    }

    return result.category;
  },

  async update(id: string, data: Category): Promise<void> {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao atualizar categoria");
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao deletar categoria");
  },
};
