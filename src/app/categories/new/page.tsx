// /app/categories/new/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Button from "@components/ui/button";
import { CategoryService } from "@lib/services/categoryService";
import { toast } from "sonner";
import DashboardLayout from "@components/layouts/DashboardLayout";
import {
  ArrowLeft,
  FolderPlus,
  Tag,
  FileText,
  Palette,
  Save,
  X,
  Hash,
  CheckCircle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  AlertTriangle,
  Loader,
  Info,
  Lightbulb,
} from "lucide-react";

export default function NewCategoryPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState("");
  const [icon, setIcon] = useState("");
  const router = useRouter();

  const predefinedColors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#F97316",
    "#06B6D4",
    "#84CC16",
    "#EC4899",
    "#6B7280",
    "#059669",
    "#DC2626",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Nome da categoria é obrigatório");
      return;
    }

    setLoading(true);
    try {
      await CategoryService.create({
        name: name.trim(),
        description: description.trim(),
        color,
        tags: tags.trim(),
        icon: icon.trim(),
      });
      toast.success("Categoria criada com sucesso!");
      router.push("/categories");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error:any) {
      toast.error(error.message || 'Erro ao criar categoria');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (name || description) {
      if (confirm("Deseja descartar as alterações?")) {
        router.push("/categories");
      }
    } else {
      router.push("/categories");
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </button>
                <div className="hidden sm:block w-px h-6 bg-gray-300" />
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FolderPlus className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      Nova Categoria
                    </h1>
                    <p className="text-sm text-gray-500">
                      Crie uma categoria para organizar seus canais
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Informações da Categoria
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Preencha os dados básicos da nova categoria
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Name Field */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Tag className="w-4 h-4 mr-2" />
                      Nome da Categoria
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Ex: Tech & Programação, Lifestyle, Gaming..."
                      required
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {name.length}/50 caracteres
                    </p>
                  </div>

                  {/* Description Field */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <FileText className="w-4 h-4 mr-2" />
                      Descrição
                      <span className="text-gray-400 ml-1">(opcional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                      placeholder="Descreva o tipo de conteúdo desta categoria..."
                      rows={4}
                      maxLength={200}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {description.length}/200 caracteres
                    </p>
                  </div>

                  {/* Tags Field */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Hash className="w-4 h-4 mr-2" />
                      Tags
                      <span className="text-gray-400 ml-1">
                        (separadas por vírgula)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="tech, educação, entretenimento..."
                    />
                  </div>

                  {/* Icon Field */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Tag className="w-4 h-4 mr-2" />
                      Ícone (opcional)
                    </label>
                    <input
                      type="text"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="ex: youtube, rocket, smile..."
                    />
                  </div>

                  {/* Color Field */}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                      <Palette className="w-4 h-4 mr-2" />
                      Cor da Categoria
                    </label>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-3">
                      {predefinedColors.map((colorOption) => (
                        <button
                          key={colorOption}
                          type="button"
                          onClick={() => setColor(colorOption)}
                          className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-105 ${
                            color === colorOption
                              ? "border-gray-800 ring-2 ring-gray-300"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                          style={{ backgroundColor: colorOption }}
                        >
                          {color === colorOption && (
                            <CheckCircle className="w-5 h-5 text-white mx-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center space-x-3">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <span className="text-sm text-gray-600">
                        Ou escolha uma cor personalizada
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !name.trim()}
                      className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Criar Categoria
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Preview */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Pré-visualização
                  </h3>
                </div>
                <div className="p-4">
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-xl mx-auto flex items-center justify-center text-white mb-3 transition-colors"
                      style={{ backgroundColor: color }}
                    >
                      <Tag className="w-8 h-8" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {name || "Nome da Categoria"}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {description ||
                        "Descrição da categoria aparecerá aqui..."}
                    </p>
                    <div className="mt-3 text-xs text-gray-400">0 canais</div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-blue-200">
                  <div className="flex items-center text-sm font-semibold text-blue-900">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Dicas
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800">
                      Use nomes descritivos e específicos
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800">
                      Cores ajudam na identificação visual
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800">
                      Descrições facilitam a organização
                    </p>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center text-sm font-semibold text-gray-900">
                    <Info className="w-4 h-4 mr-2" />
                    Informações
                  </div>
                </div>
                <div className="p-4 space-y-2 text-xs text-gray-600">
                  <p>• Após criar, você poderá adicionar canais à categoria</p>
                  <p>• Nome e cor podem ser editados posteriormente</p>
                  <p>• Categorias vazias podem ser excluídas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
