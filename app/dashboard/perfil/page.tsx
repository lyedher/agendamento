"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Mail, 
  Shield, 
  CreditCard, 
  Phone, 
  Users, 
  Save, 
  Camera,
  CheckCircle2,
  AlertCircle,
  Lock
} from "lucide-react";
import { getCurrentUser, updateUser, changePassword } from "@/lib/actions";
import { maskRG, maskCPF, maskPhone } from "@/lib/utils/masks";

const RANKS = ["Soldado", "Cabo", "3º Sargento", "2º Sargento", "1º Sargento", "Subtenente", "Aspirante", "2º Tenente", "1º Tenente", "Capitão", "Major", "Tenente-Coronel", "Coronel"];
const TEAMS = ["Alpha", "Bravo", "Charlie", "Delta", "ADM", "Afastado", "Transferido"];

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    nickname: "",
    rank: "",
    rg: "",
    taxId: "",
    phone: "",
    workTeam: "",
    photo: "",
    birthDate: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPwdMessage({ type: 'error', text: "As senhas não coincidem." });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPwdMessage({ type: 'error', text: "A senha deve ter pelo menos 6 caracteres." });
      return;
    }

    setIsChangingPassword(true);
    const res = await changePassword(currentUser.id, passwordData.newPassword);
    if (res.success) {
      setPwdMessage({ type: 'success', text: "Senha alterada com sucesso!" });
      setPasswordData({ newPassword: "", confirmPassword: "" });
    } else {
      setPwdMessage({ type: 'error', text: res.message });
    }
    setIsChangingPassword(false);
    setTimeout(() => setPwdMessage(null), 3000);
  };

  useEffect(() => {
    async function load() {
      const res = await getCurrentUser();
      if (res.success) {
        const user = res.user;
        setCurrentUser(user);
        setFormData({
          nickname: user.nickname || "",
          rank: user.rank || "",
          rg: user.rg || "",
          taxId: user.taxId || "",
          phone: user.phone || "",
          workTeam: user.workTeam || "",
          photo: user.photo || "",
          birthDate: user.birthDate || ""
        });
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    setMessage(null);

    const res = await updateUser(currentUser.id, formData);
    
    if (res.success) {
      setMessage({ type: 'success', text: "Perfil atualizado com sucesso!" });
      // Atualiza o estado local do usuário
      setCurrentUser({ ...currentUser, ...formData });
    } else {
      setMessage({ type: 'error', text: "Erro ao atualizar perfil: " + res.message });
    }
    setIsSaving(false);

    // Limpa mensagem após 3 segundos
    setTimeout(() => setMessage(null), 3000);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-gray-400">Carregando dados do perfil...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Meu Perfil
        </h1>
        <p className="text-gray-500 mt-1">
          Gerencie suas informações pessoais e funcionais.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Avatar e Status */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-0 shadow-lg bg-white overflow-hidden text-center p-6">
            <div className="relative inline-block mx-auto">
              {formData.photo ? (
                <img 
                  src={formData.photo} 
                  alt="Avatar" 
                  className="h-32 w-32 rounded-full object-cover border-4 border-[#79A3B1]/20 shadow-inner"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-[#79A3B1]/10 flex items-center justify-center border-4 border-[#79A3B1]/20">
                  <User className="h-16 w-16 text-[#79A3B1]" />
                </div>
              )}
              <button className="absolute bottom-0 right-0 p-2 bg-[#79A3B1] text-white rounded-full shadow-lg hover:bg-[#79A3B1]/90 transition-all border-2 border-white">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            
            <div className="mt-4">
              <h2 className="text-xl font-bold text-gray-900">{formData.rank} {formData.nickname}</h2>
              <p className="text-sm text-gray-500">{currentUser.email}</p>
            </div>

            <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
              <div className="text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Equipe</span>
                <span className="text-sm font-bold text-[#79A3B1]">{formData.workTeam || "—"}</span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
                <span className="text-sm font-bold text-emerald-600">Ativo</span>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-md bg-white p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#79A3B1] mt-0.5" />
              <div className="text-xs text-gray-500 leading-relaxed">
                <p className="font-bold text-gray-700 mb-1">Dica de Segurança</p>
                Certifique-se de que seus dados de contato estejam sempre atualizados para receber notificações importantes sobre suas escalas.
              </div>
            </div>
          </Card>
        </div>

        {/* Lado Direito: Formulário de Edição */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-xl bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b p-6">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#79A3B1]" />
                Dados Funcionais e Pessoais
              </CardTitle>
              <CardDescription>
                Atualize seus dados abaixo. Lembre-se de conferir antes de salvar.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSave} className="space-y-6">
                {message && (
                  <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span className="text-sm font-semibold">{message.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome de Guerra */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Nome de Guerra</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        value={formData.nickname}
                        onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                        className="pl-10 bg-gray-50 border-gray-100 focus:bg-white transition-all h-11"
                        placeholder="Ex: Lyedher"
                      />
                    </div>
                  </div>

                  {/* Posto/Graduação */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Posto / Graduação</Label>
                    <select 
                      value={formData.rank}
                      onChange={(e) => setFormData({...formData, rank: e.target.value})}
                      className="w-full h-11 px-3 rounded-md border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#79A3B1]/20 focus:bg-white transition-all"
                    >
                      <option value="">Selecione...</option>
                      {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  {/* RG */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Identidade (RG)</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        value={formData.rg}
                        onChange={(e) => setFormData({...formData, rg: maskRG(e.target.value)})}
                        className="pl-10 bg-gray-50 border-gray-100 focus:bg-white transition-all h-11"
                        placeholder="Ex: 12.345"
                      />
                    </div>
                  </div>

                  {/* CPF */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">CPF</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        value={formData.taxId}
                        onChange={(e) => setFormData({...formData, taxId: maskCPF(e.target.value)})}
                        className="pl-10 bg-gray-50 border-gray-100 focus:bg-white transition-all h-11"
                        placeholder="Ex: 000.000.000-00"
                      />
                    </div>
                  </div>

                  {/* Data de Nascimento */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Data de Nascimento</Label>
                    <div className="relative">
                      <Input 
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                        className="bg-gray-50 border-gray-100 focus:bg-white transition-all h-11"
                      />
                    </div>
                  </div>

                  {/* Telefone */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Telefone / WhatsApp</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})}
                        className="pl-10 bg-gray-50 border-gray-100 focus:bg-white transition-all h-11"
                        placeholder="Ex: (62) 9 9999-9999"
                      />
                    </div>
                  </div>

                  {/* Equipe/Lotação */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Equipe / Lotação</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select 
                        value={formData.workTeam}
                        onChange={(e) => setFormData({...formData, workTeam: e.target.value})}
                        className="w-full h-11 pl-10 pr-3 rounded-md border border-gray-100 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#79A3B1]/20 focus:bg-white transition-all appearance-none"
                      >
                        <option value="">Selecione a equipe...</option>
                        {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Email (Apenas Leitura) */}
                  <div className="space-y-2 md:col-span-2 opacity-60">
                    <Label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Endereço de E-mail (Não editável)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        value={currentUser.email}
                        disabled
                        className="pl-10 bg-gray-100 border-gray-200 cursor-not-allowed h-11"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t mt-4 flex justify-end">
                  <Button 
                    type="submit"
                    disabled={isSaving}
                    className="bg-[#79A3B1] text-white hover:bg-[#79A3B1]/90 px-8 h-11 font-bold shadow-lg shadow-[#79A3B1]/20 transition-all flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          {/* Seção de Alteração de Senha */}
          <Card className="border-0 shadow-xl bg-white overflow-hidden mt-8">
            <CardHeader className="bg-gray-50/50 border-b p-6">
              <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-500" />
                Segurança da Conta
              </CardTitle>
              <CardDescription>
                Mantenha sua senha atualizada para garantir a segurança dos seus dados.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                {pwdMessage && (
                  <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    pwdMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {pwdMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {pwdMessage.text}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-600 uppercase">Nova Senha</Label>
                  <Input 
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="bg-gray-50 border-gray-100 h-11"
                    placeholder="Digite a nova senha"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-600 uppercase">Confirmar Nova Senha</Label>
                  <Input 
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="bg-gray-50 border-gray-100 h-11"
                    placeholder="Repita a nova senha"
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-orange-500 text-white hover:bg-orange-600 font-bold px-6 h-11 flex items-center gap-2 mt-4 transition-all active:scale-95"
                >
                  {isChangingPassword ? "Alterando..." : "Alterar Senha"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
