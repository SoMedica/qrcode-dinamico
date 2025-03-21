// database.js - Gerenciamento do banco de dados IndexedDB
const db = new Dexie('QRCodeDatabase');

// Definir esquema de banco de dados
db.version(1).stores({
    qrCodes: 'id, name, url, createdAt, scans',
    scanLogs: '++id, qrId, timestamp, source, userAgent, ipAddress'
});

// Funções para manipular QR Codes
const QRCodeDB = {
    // Obter todos os QR Codes
    async getAllQRCodes() {
        return await db.qrCodes.toArray();
    },
    
    // Obter um QR Code específico
    async getQRCode(id) {
        return await db.qrCodes.get(id);
    },
    
    // Adicionar novo QR Code
    async addQRCode(qrCode) {
        return await db.qrCodes.add(qrCode);
    },
    
    // Atualizar QR Code existente
    async updateQRCode(id, changes) {
        return await db.qrCodes.update(id, changes);
    },
    
    // Excluir QR Code
    async deleteQRCode(id) {
        // Excluir os logs de scan relacionados
        await db.scanLogs.where('qrId').equals(id).delete();
        // Excluir o QR Code
        return await db.qrCodes.delete(id);
    },
    
    // Incrementar contador de scans
    async incrementScanCount(id) {
        const qrCode = await db.qrCodes.get(id);
        if (qrCode) {
            qrCode.scans = (qrCode.scans || 0) + 1;
            return await db.qrCodes.put(qrCode);
        }
        return false;
    }
};

// Funções para manipular logs de scan
const ScanLogDB = {
    // Adicionar novo log de scan
    async addScanLog(scanLog) {
        return await db.scanLogs.add(scanLog);
    },
    
    // Obter todos os logs para um QR Code específico
    async getLogsForQRCode(qrId) {
        return await db.scanLogs.where('qrId').equals(qrId).toArray();
    },
    
    // Obter estatísticas diárias para um QR Code
    async getDailyStats(qrId, days = 14) {
        const logs = await this.getLogsForQRCode(qrId);
        const result = {};
        
        // Inicializar dias
        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = formatDateShort(date);
            result[dateStr] = 0;
        }
        
        // Contar scans por dia
        logs.forEach(log => {
            const date = new Date(log.timestamp);
            const dateStr = formatDateShort(date);
            if (result[dateStr] !== undefined) {
                result[dateStr]++;
            }
        });
        
        return result;
    },
    
    // Obter estatísticas mensais
    async getMonthlyStats() {
        const logs = await db.scanLogs.toArray();
        const result = Array(12).fill(0);
        
        logs.forEach(log => {
            const date = new Date(log.timestamp);
            const month = date.getMonth();
            result[month]++;
        });
        
        return result;
    },
    
    // Obter total de scans
    async getTotalScans() {
        return await db.scanLogs.count();
    }
};

// Função auxiliar para formatar data
function formatDateShort(date) {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// Exportar para uso global
window.QRCodeDB = QRCodeDB;
window.ScanLogDB = ScanLogDB;
