'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import  Button  from '@components/ui/button';
import { CategoryService } from '@lib/services/categoryService';
import { toast } from 'sonner';
import type { Category } from '@lib/services/categoryService';
import {
  Youtube,
  Search,
  Plus,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Loader,
  FolderPlus,
  Tag,
  Users,
  Calendar,
  Hash,
} from "lucide-react";

export default function CategoryListPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const router = useRouter();

  useEffect(() => {
    CategoryService.list()
      .then(setCategories)
      .catch(() => toast.error('Erro ao carregar categorias'));
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await CategoryService.remove(id);
        setCategories(categories.filter(cat => cat._id !== id));
        toast.success('Categoria deletada com sucesso');
      } catch {
        toast.error('Erro ao deletar categoria');
      }
    }
  };

  return (
    <div className="p-6">

        {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gerenciamento das Categorias
              </h1>
             
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Button onClick={() => router.push('/categories/new')}>Nova Categoria</Button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2 border-b">Nome</th>
              <th className="p-2 border-b text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat: any) => (
              <tr key={cat._id}>
                <td className="p-2 border-b">{cat.name}</td>
                <td className="p-2 border-b text-right space-x-2">
                  <Button onClick={() => router.push(`/categories/${cat._id}/edit`)} size="sm">
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(cat._id)}>
                    Deletar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}