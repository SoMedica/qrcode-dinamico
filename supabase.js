// supabase.js - Configuração e funções do Supabase
const SUPABASE_URL = https://kgiqdzgeaernrzeotxip.supabase.co;
const SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnaXFkemdlYWVybnJ6ZW90eGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1ODY3OTcsImV4cCI6MjA1ODE2Mjc5N30.HBbb6yFDlgvyOyXj13bpxuxL1klZJ5OURyEyctEyUHo;

// Inicializar cliente Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variáveis de estado
let currentUser = null;

// Funções de autenticação
const Auth = {
    // Registrar novo usuário
    async register(email, password) {
        const { user, error } = await supabase.auth.signUp({
            email, 
            password
        });
        
        if (error) throw error;
        return user;
    },
    
    // Login de usuário
    async login(email, password) {
        const { user, error } = await supabase.auth.signIn({
            email,
            password
        });
        
        if (error) throw error;
        currentUser = user;
        return user;
    },
    
    // Verificar sessão atual
    async getCurrentUser() {
        if (currentUser) return currentUser;
        
        const user = supabase.auth.user();
        currentUser = user;
        return user;
    },
    
    // Logout
    async logout() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        currentUser = null;
    }
};

// Funções para manipular QR Codes
const QRCodeDB = {
    // Obter todos os QR Codes
    async getAllQRCodes() {
        const { data, error } = await supabase
            .from('qr_codes')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        return data;
    },
    
    // Obter um QR Code específico
    async getQRCode(id) {
        const { data, error } = await supabase
            .from('qr_codes')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) throw error;
        return data;
    },
    
    // Adicionar novo QR Code
    async addQRCode(qrCode) {
        const { data, error } = await supabase
            .from('qr_codes')
            .insert([qrCode]);
            
        if (error) throw error;
        return data;
    },
    
    // Atualizar QR Code existente
    async updateQRCode(id, changes) {
        const { data, error } = await supabase
            .from('qr_codes')
            .update(changes)
            .eq('id', id);
            
        if (error) throw error;
        return data;
    },
    
    // Excluir QR Code
    async deleteQRCode(id) {
        // Excluir os logs de scan relacionados
        await supabase
            .from('scan_logs')
            .delete()
            .eq('qr_id', id);
            
        // Excluir o QR Code
        const { error } = await supabase
            .from('qr_codes')
            .delete()
            .eq('id', id);
            
        if (error) throw error;
        return true;
    },
    
    // Incrementar contador de scans
    async incrementScanCount(id) {
        const { data, error } = await supabase.rpc('increment_scan_count', { qr_id: id });
        
        if (error) throw error;
        return data;
    }
};

// Funções para manipular logs de scan
const ScanLogDB = {
    // Adicionar novo log de scan
    async addScanLog(scanLog) {
        const { data, error } = await supabase
            .from('scan_logs')
            .insert([scanLog]);
            
        if (error) throw error;
        return data;
    },
    
    // Obter todos os logs para um QR Code específico
    async getLogsForQRCode(qrId) {
        const { data, error } = await supabase
            .from('scan_logs')
            .select('*')
            .eq('qr_id', qrId);
            
        if (error) throw error;
        return data;
    },
    
    // Obter estatísticas diárias para um QR Code
    async getDailyStats(qrId, days = 14) {
        const { data, error } = await supabase.rpc('get_daily_stats', { 
            qr_id: qrId,
            days_count: days
        });
        
        if (error) throw error;
        
        // Converter para o formato esperado pelo aplicativo
        const result = {};
        for (const row of data) {
            result[formatDateShort(new Date(row.date))] = row.count;
        }
        
        return result;
    },
    
    // Obter estatísticas mensais
    async getMonthlyStats() {
        const user = await Auth.getCurrentUser();
        if (!user) throw new Error("Usuário não autenticado");
        
        const { data, error } = await supabase.rpc('get_monthly_stats', {
            user_id: user.id
        });
        
        if (error) throw error;
        
        // Converter para array de 12 posições
        const result = Array(12).fill(0);
        for (const row of data) {
            const month = parseInt(row.month) - 1; // 0-based
            result[month] = row.count;
        }
        
        return result;
    },
    
    // Obter total de scans
    async getTotalScans() {
        const user = await Auth.getCurrentUser();
        if (!user) throw new Error("Usuário não autenticado");
        
        const { count, error } = await supabase
            .from('scan_logs')
            .select('id', { count: 'exact', head: true })
            .filter('qr_id', 'in', `(SELECT id FROM qr_codes WHERE user_id = '${user.id}')`);
            
        if (error) throw error;
        return count || 0;
    }
};

// Função auxiliar para formatar data
function formatDateShort(date) {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// Exportar para uso global
window.Auth = Auth;
window.QRCodeDB = QRCodeDB;
window.ScanLogDB = ScanLogDB;
