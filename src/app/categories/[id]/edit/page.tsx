// /app/categories/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import  Button  from '@components/ui/button';
import { CategoryService } from '@lib/services/categoryService';
import { toast } from 'sonner';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const [name, setName] = useState('');

  useEffect(() => {
    CategoryService.get(params.id)
      .then(cat => setName(cat.name))
      .catch(() => toast.error('Erro ao carregar categoria'));
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await CategoryService.update(params.id, { name });
      toast.success('Categoria atualizada com sucesso');
      router.push('/categories');
    } catch {
      toast.error('Erro ao atualizar categoria');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Editar Categoria</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          className="w-full border p-2 rounded"
          placeholder="Nome da Categoria"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Button type="submit">Salvar Alterações</Button>
      </form>
    </div>
  );
}