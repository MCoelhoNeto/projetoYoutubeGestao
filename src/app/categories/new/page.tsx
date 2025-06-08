// /app/categories/new/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import  Button  from '@components/ui/button';
import { CategoryService } from '@lib/services/categoryService';
import { toast } from 'sonner';

export default function NewCategoryPage() {
  const [name, setName] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await CategoryService.create({ name });
      toast.success('Categoria criada com sucesso');
      router.push('/categories');
    } catch {
      toast.error('Erro ao criar categoria');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Nova Categoria</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          className="w-full border p-2 rounded"
          placeholder="Nome da Categoria"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Button type="submit">Salvar</Button>
      </form>
    </div>
  );
}