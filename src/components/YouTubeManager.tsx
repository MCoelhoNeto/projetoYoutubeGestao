import React, { useState, useEffect } from 'react';
import { 
  Plus, Youtube, Copy, Brain, Calendar, Clock, Eye, MessageSquare, 
  Settings, Key, Database, Tag, Save, Edit3, Trash2, FolderOpen,
  CheckCircle, AlertCircle, Loader
} from 'lucide-react';

const YouTubeChannelManager = () => {
  // Estados principais
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [opinion, setOpinion] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  // Estados para configurações
  const [apiConfig, setApiConfig] = useState({
    youtubeApiKey: '',
    geminiApiKey: '',
    mongodbUri: 'mongodb://localhost:27017/youtube-manager'
  });
  
  // Estados para categorias
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Estados para canais
  const [newChannel, setNewChannel] = useState({
    name: '',
    url: '',
    categoryId: '',
    description: ''
  });
  
  // Estados de conexão
  const [connectionStatus, setConnectionStatus] = useState({
    mongodb: 'disconnected', // connected, disconnected, connecting
    youtube: 'unconfigured', // configured, unconfigured, error
    gemini: 'unconfigured'
  });

  // Dados iniciais simulados
  const initialCategories = [
    { id: 1, name: 'Tecnologia', color: '#3B82F6', channelCount: 0 },
    { id: 2, name: 'Educação', color: '#10B981', channelCount: 0 },
    { id: 3, name: 'Entretenimento', color: '#F59E0B', channelCount: 0 },
    { id: 4, name: 'Notícias', color: '#EF4444', channelCount: 0 }
  ];

  const initialChannels = [
    {
      id: 1,
      name: 'Tech Review Brasil',
      url: '@techreviewbr',
      categoryId: 1,
      subscribers: '250K',
      description: 'Reviews de tecnologia em português',
      isActive: true,
      lastSync: '2024-06-06T10:00:00Z'
    },
    {
      id: 2,
      name: 'Programação Diária',
      url: '@progdiaria',
      categoryId: 1,
      subscribers: '180K',
      description: 'Conteúdo diário sobre programação',
      isActive: true,
      lastSync: '2024-06-06T09:30:00Z'
    }
  ];

  // Simulação de configuração salva
  useEffect(() => {
    // Carregar configurações salvas (simulado)
    const savedConfig = {
      youtubeApiKey: 'AIzaSy...(configurar)',
      geminiApiKey: 'AIzaSy...(configurar)',
      mongodbUri: 'mongodb://localhost:27017/youtube-manager'
    };
    setApiConfig(savedConfig);
    
    // Carregar dados iniciais
    setCategories(initialCategories);
    setChannels(initialChannels);
    
    // Simular verificação de conexões
    checkConnections();
  }, []);

  const checkConnections = async () => {
    setConnectionStatus(prev => ({ ...prev, mongodb: 'connecting' }));
    
    // Simular verificação de conexão MongoDB
    setTimeout(() => {
      setConnectionStatus(prev => ({ 
        ...prev, 
        mongodb: 'connected',
        youtube: apiConfig.youtubeApiKey ? 'configured' : 'unconfigured',
        gemini: apiConfig.geminiApiKey ? 'configured' : 'unconfigured'
      }));
    }, 1500);
  };

  // Funções para categorias
  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory = {
      id: Date.now(),
      name: newCategoryName,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      channelCount: 0
    };
    
    setCategories([...categories, newCategory]);
    setNewCategoryName('');
  };

  const updateCategory = (categoryId, updates) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId ? { ...cat, ...updates } : cat
    ));
    setEditingCategory(null);
  };

  const deleteCategory = (categoryId) => {
    // Verificar se há canais nesta categoria
    const channelsInCategory = channels.filter(ch => ch.categoryId === categoryId);
    if (channelsInCategory.length > 0) {
      alert('Não é possível excluir uma categoria que possui canais. Mova os canais primeiro.');
      return;
    }
    
    setCategories(categories.filter(cat => cat.id !== categoryId));
  };

  // Funções para canais
  const addChannel = async () => {
    if (!newChannel.name.trim() || !newChannel.url.trim()) return;
    
    setLoading(true);
    
    // Simular adição no MongoDB
    const channelData = {
      id: Date.now(),
      ...newChannel,
      subscribers: '0',
      isActive: true,
      lastSync: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    setTimeout(() => {
      setChannels([...channels, channelData]);
      
      // Atualizar contador da categoria
      setCategories(categories.map(cat => 
        cat.id === parseInt(newChannel.categoryId) 
          ? { ...cat, channelCount: cat.channelCount + 1 }
          : cat
      ));
      
      setNewChannel({ name: '', url: '', categoryId: '', description: '' });
      setLoading(false);
    }, 1000);
  };

  const removeChannel = (channelId) => {
    const channel = channels.find(ch => ch.id === channelId);
    if (!channel) return;
    
    setChannels(channels.filter(ch => ch.id !== channelId));
    
    // Atualizar contador da categoria
    setCategories(categories.map(cat => 
      cat.id === channel.categoryId 
        ? { ...cat, channelCount: Math.max(0, cat.channelCount - 1) }
        : cat
    ));
  };

  const syncChannel = async (channelId) => {
    setLoading(true);
    
    // Simular sincronização com YouTube API
    setTimeout(() => {
      setChannels(channels.map(ch => 
        ch.id === channelId 
          ? { ...ch, lastSync: new Date().toISOString() }
          : ch
      ));
      setLoading(false);
      alert('Canal sincronizado com sucesso!');
    }, 2000);
  };

  // Funções para configuração
  const saveApiConfig = () => {
    // Simular salvamento no MongoDB
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Configurações salvas com sucesso!');
      checkConnections();
    }, 1000);
  };

  const testApiConnection = async (apiType) => {
    setLoading(true);
    
    // Simular teste de conexão
    setTimeout(() => {
      setConnectionStatus(prev => ({
        ...prev,
        [apiType]: Math.random() > 0.3 ? 'configured' : 'error'
      }));
      setLoading(false);
    }, 1500);
  };

  // Função para obter nome da categoria
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sem categoria';
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.color : '#6B7280';
  };

  // Status icons
  const getStatusIcon = (status) => {
    switch(status) {
      case 'connected':
      case 'configured':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'connecting':
        return <Loader className="text-blue-500 animate-spin" size={16} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={16} />;
      default:
        return <AlertCircle className="text-gray-400" size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-4 md:mb-0">
            <Youtube className="text-red-600" />
            YouTube Manager Pro
          </h1>
          
          {/* Status da Conexão */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Database size={16} />
              {getStatusIcon(connectionStatus.mongodb)}
              <span>MongoDB</span>
            </div>
            <div className="flex items-center gap-2">
              <Youtube size={16} />
              {getStatusIcon(connectionStatus.youtube)}
              <span>YouTube API</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain size={16} />
              {getStatusIcon(connectionStatus.gemini)}
              <span>Gemini API</span>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Eye },
              { id: 'categories', label: 'Categorias', icon: Tag },
              { id: 'channels', label: 'Canais', icon: Youtube },
              { id: 'videos', label: 'Vídeos', icon: Calendar },
              { id: 'transcript', label: 'Transcrição', icon: MessageSquare },
              { id: 'settings', label: 'Configurações', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo das Abas */}
        <div className="space-y-6">
          
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Canais</p>
                    <p className="text-2xl font-bold text-gray-800">{channels.length}</p>
                  </div>
                  <Youtube className="text-red-500" size={24} />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Categorias</p>
                    <p className="text-2xl font-bold text-gray-800">{categories.length}</p>
                  </div>
                  <Tag className="text-blue-500" size={24} />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Vídeos Diários</p>
                    <p className="text-2xl font-bold text-gray-800">8</p>
                  </div>
                  <Calendar className="text-green-500" size={24} />
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Última Sync</p>
                    <p className="text-sm text-gray-800">Há 2 horas</p>
                  </div>
                  <Clock className="text-purple-500" size={24} />
                </div>
              </div>
            </div>
          )}

          {/* Categorias */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Gerenciar Categorias</h2>
                <div className="flex gap-3 mb-6">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nome da nova categoria"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={addCategory}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={20} />
                    Adicionar
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(category => (
                    <div key={category.id} className="border rounded-lg p-4">
                      {editingCategory === category.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            defaultValue={category.name}
                            onBlur={(e) => updateCategory(category.id, { name: e.target.value })}
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: category.color }}
                              ></div>
                              <h3 className="font-medium">{category.name}</h3>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditingCategory(category.id)}
                                className="p-1 text-gray-400 hover:text-blue-600"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => deleteCategory(category.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">{category.channelCount} canais</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Canais */}
          {activeTab === 'channels' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Adicionar Novo Canal</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    value={newChannel.name}
                    onChange={(e) => setNewChannel({...newChannel, name: e.target.value})}
                    placeholder="Nome do canal"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={newChannel.url}
                    onChange={(e) => setNewChannel({...newChannel, url: e.target.value})}
                    placeholder="URL ou @ do canal"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={newChannel.categoryId}
                    onChange={(e) => setNewChannel({...newChannel, categoryId: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newChannel.description}
                    onChange={(e) => setNewChannel({...newChannel, description: e.target.value})}
                    placeholder="Descrição (opcional)"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={addChannel}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader className="animate-spin" size={20} /> : <Plus size={20} />}
                  {loading ? 'Adicionando...' : 'Adicionar Canal'}
                </button>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Canais Cadastrados</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channels.map(channel => (
                    <div key={channel.id} className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800 mb-1">{channel.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{channel.url}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: getCategoryColor(channel.categoryId) }}
                            ></div>
                            <span className="text-xs text-gray-500">{getCategoryName(channel.categoryId)}</span>
                          </div>
                          <p className="text-xs text-gray-500">{channel.subscribers} inscritos</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => syncChannel(channel.id)}
                            className="p-1 text-gray-400 hover:text-blue-600"
                            title="Sincronizar"
                          >
                            <Database size={16} />
                          </button>
                          <button
                            onClick={() => removeChannel(channel.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Remover"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        Última sync: {new Date(channel.lastSync).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Configurações */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Key className="text-blue-600" />
                  Configuração das APIs
                </h2>
                
                <div className="space-y-6">
                  {/* YouTube API */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      YouTube Data API v3 Key
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="password"
                        value={apiConfig.youtubeApiKey}
                        onChange={(e) => setApiConfig({...apiConfig, youtubeApiKey: e.target.value})}
                        placeholder="AIzaSyBnVX..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => testApiConnection('youtube')}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Testar
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Obtenha sua chave em: Google Cloud Console → APIs & Services → Credentials
                    </p>
                  </div>

                  {/* Gemini API */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Gemini API Key
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="password"
                        value={apiConfig.geminiApiKey}
                        onChange={(e) => setApiConfig({...apiConfig, geminiApiKey: e.target.value})}
                        placeholder="AIzaSyBnVX..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => testApiConnection('gemini')}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Testar
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Obtenha sua chave em: Google AI Studio → Get API Key
                    </p>
                  </div>

                  {/* MongoDB URI */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      MongoDB Connection URI
                    </label>
                    <input
                      type="text"
                      value={apiConfig.mongodbUri}
                      onChange={(e) => setApiConfig({...apiConfig, mongodbUri: e.target.value})}
                      placeholder="mongodb://localhost:27017/youtube-manager"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Local: mongodb://localhost:27017/youtube-manager<br/>
                      MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/database
                    </p>
                  </div>

                  <button
                    onClick={saveApiConfig}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                    {loading ? 'Salvando...' : 'Salvar Configurações'}
                  </button>
                </div>
              </div>

              {/* Status das Conexões */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Status das Conexões</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Database size={20} />
                      <span>MongoDB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(connectionStatus.mongodb)}
                      <span className="text-sm text-gray-600">
                        {connectionStatus.mongodb === 'connected' ? 'Conectado' : 
                         connectionStatus.mongodb === 'connecting' ? 'Conectando...' : 'Desconectado'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Youtube size={20} />
                      <span>YouTube API</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(connectionStatus.youtube)}
                      <span className="text-sm text-gray-600">
                        {connectionStatus.youtube === 'configured' ? 'Configurado' : 
                         connectionStatus.youtube === 'error' ? 'Erro' : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Brain size={20} />
                      <span>Gemini API</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(connectionStatus.gemini)}
                      <span className="text-sm text-gray-600">
                        {connectionStatus.gemini === 'configured' ? 'Configurado' : 
                         connectionStatus.gemini === 'error' ? 'Erro' : 'Não configurado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder para outras abas */}
          {(activeTab === 'videos' || activeTab === 'transcript') && (
            <div className="bg-white rounded-lg p-8 shadow-sm text-center">
              <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {activeTab === 'videos' ? 'Vídeos' : 'Transcrição'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'videos' 
                  ? 'Configure as APIs para visualizar vídeos dos canais' 
                  : 'Selecione um vídeo para ver sua transcrição'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YouTubeChannelManager;