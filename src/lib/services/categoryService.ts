const BASE_URL = "/api/categories";

export const CategoryService = {
  async list() {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error("Erro ao buscar categorias");
    const data = await res.json();
    return data.categories;
  },

  async create(data: {
    name: string;
    description?: string;
    color?: string;
    tags?: string;
    icon?: string;
  }) {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao criar categoria");
    return await res.json();
  },

  async update(id: string, data: any) {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao atualizar categoria");
    return await res.json();
  },

  async getById(id: string) {
    const res = await fetch(`${BASE_URL}/${id}`);
    if (!res.ok) throw new Error("Erro ao carregar categoria");
    const data = await res.json();
    return data.category;
  },

  async remove(id: string) {
    const res = await fetch(`/api/categories/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Erro ao deletar categoria");
    }
  },
};
